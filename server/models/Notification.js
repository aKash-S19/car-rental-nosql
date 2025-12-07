const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'Booking Confirmation',
      'Booking Cancelled',
      'Pickup Reminder',
      'Return Reminder',
      'Issue Resolved',
      'Payment Received',
      'Document Verified',
      'Loyalty Reward',
      'System Alert'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  relatedIssue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
