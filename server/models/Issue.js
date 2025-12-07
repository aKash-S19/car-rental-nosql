const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  issueType: {
    type: String,
    enum: ['Vehicle Damage', 'Mechanical Problem', 'Service Complaint', 'Billing Issue', 'Other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  adminResponse: {
    type: String,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: Date,
  resolvedAt: Date,
  resolution: {
    type: String,
    trim: true
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  // For tracking issue updates
  updates: [{
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updateText: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
issueSchema.index({ reportedBy: 1, createdAt: -1 });
issueSchema.index({ car: 1 });
issueSchema.index({ status: 1 });
issueSchema.index({ priority: 1 });

module.exports = mongoose.model('Issue', issueSchema);
