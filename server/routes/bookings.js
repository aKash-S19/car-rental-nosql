const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// GET all bookings (Admin) or user's bookings (Customer)
router.get('/', async (req, res) => {
  try {
    const { userId, role } = req.query;

    let query = {};
    if (role !== 'admin') {
      query.customer = userId;
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('car', 'brand model year plateNumber pricePerDay images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// GET single booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('car', 'brand model year plateNumber pricePerDay images features')
      .populate('cancelledBy', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
});

// POST create new booking
router.post('/create', async (req, res) => {
  try {
    const {
      userId,
      carId,
      startDate,
      endDate,
      pickupTime,
      purpose,
      specialRequirements,
      pickupLocation,
      returnLocation,
      driverLicense
    } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate car exists and is available
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.availabilityStatus !== 'Available') {
      return res.status(400).json({ message: 'Car is not available for booking' });
    }

    // Check date availability
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    if (start < new Date()) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }

    // Check for overlapping bookings
    const isAvailable = await Booking.checkAvailability(carId, start, end);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Car is already booked for selected dates' });
    }

    // Calculate total days and price
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = totalDays * car.pricePerDay;

    // Create booking
    const booking = new Booking({
      customer: userId,
      car: carId,
      startDate: start,
      endDate: end,
      pickupTime,
      totalDays,
      pricePerDay: car.pricePerDay,
      totalPrice,
      purpose,
      specialRequirements,
      pickupLocation,
      returnLocation,
      driverLicense,
      bookingStatus: 'Pending'
    });

    await booking.save();

    // Update car status to Booked
    car.availabilityStatus = 'Booked';
    await car.save();

    // Create notification
    await Notification.create({
      user: userId,
      type: 'Booking Confirmation',
      title: 'Booking Created',
      message: `Your booking for ${car.brand} ${car.model} has been created and is pending confirmation.`,
      relatedBooking: booking._id,
      priority: 'Medium'
    });

    // Create audit log
    await AuditLog.create({
      user: userId,
      action: 'Booking Created',
      details: `Booking created for ${car.brand} ${car.model}`,
      resourceType: 'Booking',
      resourceId: booking._id
    });

    // Populate booking details for response
    await booking.populate('customer', 'name email phone');
    await booking.populate('car', 'brand model year plateNumber pricePerDay images');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// PATCH confirm booking (Admin)
router.patch('/:id/confirm', async (req, res) => {
  try {
    const { userId } = req.body;

    // Verify admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.bookingStatus = 'Confirmed';
    await booking.save();

    // Create notification
    await Notification.create({
      user: booking.customer,
      type: 'Booking Confirmation',
      title: 'Booking Confirmed',
      message: `Your booking has been confirmed! Pickup date: ${booking.startDate.toDateString()}`,
      relatedBooking: booking._id,
      priority: 'High'
    });

    // Create audit log
    await AuditLog.create({
      user: userId,
      action: 'Booking Confirmed',
      details: `Booking ${booking._id} confirmed by admin`,
      resourceType: 'Booking',
      resourceId: booking._id
    });

    await booking.populate('customer', 'name email phone');
    await booking.populate('car', 'brand model year plateNumber');

    res.json({
      success: true,
      message: 'Booking confirmed',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming booking', error: error.message });
  }
});

// PATCH start rental (pickup)
router.patch('/:id/pickup', async (req, res) => {
  try {
    const { userId, mileageAtPickup, fuelLevelAtPickup, pickupNotes } = req.body;

    // Verify admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookingStatus !== 'Confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed before pickup' });
    }

    booking.bookingStatus = 'Active';
    booking.actualPickupDate = new Date();
    booking.mileageAtPickup = mileageAtPickup;
    booking.fuelLevelAtPickup = fuelLevelAtPickup;
    booking.pickupNotes = pickupNotes;

    await booking.save();

    res.json({
      success: true,
      message: 'Rental started - vehicle picked up',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing pickup', error: error.message });
  }
});

// PATCH complete rental (return)
router.patch('/:id/return', async (req, res) => {
  try {
    const { userId, mileageAtReturn, fuelLevelAtReturn, returnNotes, damageReported } = req.body;

    // Verify admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookingStatus !== 'Active') {
      return res.status(400).json({ message: 'Booking must be active to process return' });
    }

    booking.bookingStatus = 'Completed';
    booking.actualReturnDate = new Date();
    booking.mileageAtReturn = mileageAtReturn;
    booking.fuelLevelAtReturn = fuelLevelAtReturn;
    booking.returnNotes = returnNotes;
    booking.damageReported = damageReported || false;

    // Update car status
    const car = await Car.findById(booking.car._id);
    if (damageReported) {
      car.availabilityStatus = 'Maintenance';
    } else {
      car.availabilityStatus = 'Available';
    }
    
    // Update mileage
    if (mileageAtReturn) {
      car.mileage = mileageAtReturn;
    }

    await car.save();
    await booking.save();

    // Update customer loyalty points and total bookings
    const customer = await User.findById(booking.customer);
    if (customer) {
      customer.totalBookings += 1;
      // Award loyalty points (e.g., 10 points per booking)
      customer.loyaltyPoints += 10;
      await customer.save();

      // Create notification
      await Notification.create({
        user: customer._id,
        type: 'Loyalty Reward',
        title: 'Loyalty Points Earned!',
        message: `You've earned 10 loyalty points for completing your rental. Total points: ${customer.loyaltyPoints}`,
        relatedBooking: booking._id,
        priority: 'Low'
      });
    }

    // Create completion notification
    await Notification.create({
      user: booking.customer,
      type: 'Booking Confirmation',
      title: 'Rental Completed',
      message: `Your rental has been completed. Thank you for choosing us!`,
      relatedBooking: booking._id,
      priority: 'Medium'
    });

    // Create audit log
    await AuditLog.create({
      user: userId,
      action: 'Booking Completed',
      details: `Booking ${booking._id} completed`,
      resourceType: 'Booking',
      resourceId: booking._id
    });

    res.json({
      success: true,
      message: 'Rental completed - vehicle returned',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing return', error: error.message });
  }
});

// PATCH cancel booking
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { userId, cancellationReason } = req.body;

    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized (customer who made booking or admin)
    const user = await User.findById(userId);
    const isAuthorized = booking.customer.toString() === userId || user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (['Completed', 'Cancelled'].includes(booking.bookingStatus)) {
      return res.status(400).json({ message: 'Cannot cancel completed or already cancelled booking' });
    }

    booking.bookingStatus = 'Cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledBy = userId;
    booking.cancelledAt = new Date();

    await booking.save();

    // Update car status back to Available if it was Booked
    const car = await Car.findById(booking.car._id);
    if (car && car.availabilityStatus === 'Booked') {
      car.availabilityStatus = 'Available';
      await car.save();
    }

    // Create notification
    await Notification.create({
      user: booking.customer,
      type: 'Booking Cancelled',
      title: 'Booking Cancelled',
      message: `Your booking has been cancelled. ${cancellationReason ? 'Reason: ' + cancellationReason : ''}`,
      relatedBooking: booking._id,
      priority: 'Medium'
    });

    // Create audit log
    await AuditLog.create({
      user: userId,
      action: 'Booking Cancelled',
      details: `Booking ${booking._id} cancelled. Reason: ${cancellationReason || 'Not specified'}`,
      resourceType: 'Booking',
      resourceId: booking._id
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
});

// PATCH update payment status (Admin)
router.patch('/:id/payment', async (req, res) => {
  try {
    const { userId, paymentStatus } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment status updated',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment status', error: error.message });
  }
});

// GET check car availability for date range
router.get('/availability/check', async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.query;

    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Car ID, start date, and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const isAvailable = await Booking.checkAvailability(carId, start, end);

    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Car is available for selected dates' : 'Car is not available for selected dates'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking availability', error: error.message });
  }
});

// GET booking statistics (Admin)
router.get('/stats/overview', async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ bookingStatus: 'Active' });
    const pendingBookings = await Booking.countDocuments({ bookingStatus: 'Pending' });
    const completedBookings = await Booking.countDocuments({ bookingStatus: 'Completed' });
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'Cancelled' });

    const totalRevenue = await Booking.aggregate([
      { $match: { bookingStatus: 'Completed', paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings,
        activeBookings,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;
