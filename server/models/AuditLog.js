const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'User Login',
      'User Logout',
      'User Registration',
      'Vehicle Added',
      'Vehicle Updated',
      'Vehicle Deleted',
      'Vehicle Status Changed',
      'Booking Created',
      'Booking Updated',
      'Booking Confirmed',
      'Booking Cancelled',
      'Booking Completed',
      'Issue Created',
      'Issue Updated',
      'Issue Resolved',
      'Document Uploaded',
      'Document Verified',
      'User Updated',
      'User Role Changed',
      'User Deactivated',
      'Payment Processed',
      'Unauthorized Access Attempt'
    ]
  },
  details: {
    type: String
  },
  resourceType: {
    type: String,
    enum: ['User', 'Vehicle', 'Booking', 'Issue', 'Document', 'Payment', 'System']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  ipAddress: String,
  userAgent: String,
  statusCode: Number,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for audit trail queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
