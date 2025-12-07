const express = require('express');
const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const Issue = require('../models/Issue');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Middleware to check admin role
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Vehicle statistics
    const totalVehicles = await Car.countDocuments();
    const carsAvailable = await Car.countDocuments({ availabilityStatus: 'Available' });
    const carsRented = await Car.countDocuments({ availabilityStatus: 'Booked' });
    const carsMaintenance = await Car.countDocuments({ availabilityStatus: 'Maintenance' });

    // Booking statistics
    const totalBookings = await Booking.countDocuments();
    const dailyBookings = await Booking.countDocuments({ 
      createdAt: { $gte: today } 
    });
    const monthlyBookings = await Booking.countDocuments({ 
      createdAt: { $gte: monthStart } 
    });
    const activeBookings = await Booking.countDocuments({ 
      bookingStatus: { $in: ['Confirmed', 'Active'] } 
    });
    const pendingBookings = await Booking.countDocuments({ 
      bookingStatus: 'Pending' 
    });

    // Revenue statistics
    const revenueData = await Booking.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          averageBookingValue: { $avg: '$totalPrice' }
        }
      }
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const averageBookingValue = revenueData[0]?.averageBookingValue || 0;

    const monthlyRevenue = await Booking.aggregate([
      { 
        $match: { 
          paymentStatus: 'Paid',
          createdAt: { $gte: monthStart }
        } 
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Issue statistics
    const totalIssues = await Issue.countDocuments();
    const openIssues = await Issue.countDocuments({ status: 'Open' });
    const pendingIssues = await Issue.countDocuments({ status: 'In Progress' });
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const pendingVerifications = await User.countDocuments({ 
      verificationStatus: 'Pending' 
    });

    res.json({
      vehicles: {
        total: totalVehicles,
        available: carsAvailable,
        rented: carsRented,
        maintenance: carsMaintenance
      },
      bookings: {
        total: totalBookings,
        daily: dailyBookings,
        monthly: monthlyBookings,
        active: activeBookings,
        pending: pendingBookings
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue[0]?.revenue || 0,
        average: averageBookingValue
      },
      issues: {
        total: totalIssues,
        open: openIssues,
        pending: pendingIssues,
        resolved: resolvedIssues
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        pendingVerifications
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all users with filters
router.get('/users', async (req, res) => {
  try {
    const { role, isActive, isVerified, verificationStatus, search, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalUsers = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's booking history
    const bookings = await Booking.find({ customer: user._id })
      .populate('car', 'brand model plateNumber')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's issues
    const issues = await Issue.find({ reportedBy: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      user,
      bookings,
      issues
    });
  } catch (err) {
    console.error('Get user details error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Use updateOne with runValidators: false to skip validation
    await User.updateOne(
      { _id: req.params.id },
      { $set: { isActive: isActive } },
      { runValidators: false }
    );

    // Create audit log (wrapped in try-catch to prevent blocking)
    try {
      await AuditLog.create({
        user: req.user.userId,
        action: 'User Status Updated',
        details: `User ${user.email} ${isActive ? 'activated' : 'deactivated'}`,
        resourceType: 'User',
        resourceId: user._id,
        ipAddress: req.ip || req.connection.remoteAddress
      });
    } catch (logError) {
      console.error('Audit log error:', logError);
    }

    // Create notification for user (wrapped in try-catch to prevent blocking)
    try {
      await Notification.create({
        user: user._id,
        type: 'System Alert',
        title: isActive ? 'Account Activated' : 'Account Deactivated',
        message: isActive 
          ? 'Your account has been activated by an administrator.' 
          : 'Your account has been deactivated. Please contact support for assistance.',
        priority: 'High'
      });
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json({ 
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Update user status error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      action: 'User Role Changed',
      details: `User ${user.email} role changed to ${role}`,
      resourceType: 'User',
      resourceId: user._id,
      ipAddress: req.ip
    });

    res.json({ 
      message: 'User role updated successfully',
      user: await User.findById(user._id).select('-password')
    });
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, userId, resourceType, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.user = userId;
    if (resourceType) filter.resourceType = resourceType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalLogs = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        pages: Math.ceil(totalLogs / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
