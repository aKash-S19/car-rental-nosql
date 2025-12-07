const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { isRead, limit = 20 } = req.query;
    
    const filter = { user: req.user.userId };
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('relatedBooking', 'bookingNumber startDate endDate')
      .populate('relatedIssue', 'title status');

    const unreadCount = await Notification.countDocuments({ 
      user: req.user.userId, 
      isRead: false 
    });

    res.json({ 
      notifications, 
      unreadCount 
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ 
      message: 'Notification marked as read',
      notification
    });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notification (internal use/admin)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId, type, title, message, priority, relatedBooking, relatedIssue } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: 'userId, type, title, and message are required' });
    }

    // Check user's notification preferences
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      priority: priority || 'Medium',
      relatedBooking,
      relatedIssue
    });

    await notification.save();

    res.status(201).json({ 
      message: 'Notification created successfully',
      notification
    });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
