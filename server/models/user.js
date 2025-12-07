const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  // Profile & Document Management
  driverLicense: {
    number: String,
    expiryDate: Date,
    issuedState: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['ID Proof', 'License Scan', 'Address Proof', 'Other']
    },
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  }],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  // Loyalty & Rewards
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  // Notifications
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    bookingReminders: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: Date,
  accountCreatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);