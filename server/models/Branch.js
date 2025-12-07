const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  address: {
    street: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  }],
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  capacity: {
    type: Number,
    default: 50
  },
  currentVehicleCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
branchSchema.index({ code: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ 'address.city': 1, 'address.state': 1 });

module.exports = mongoose.model('Branch', branchSchema);
