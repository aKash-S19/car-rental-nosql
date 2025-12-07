const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  transmission: {
    type: String,
    enum: ['Manual', 'Automatic', 'Semi-Automatic'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    required: true
  },
  seatingCapacity: {
    type: Number,
    required: true,
    min: 2,
    max: 15
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  availabilityStatus: {
    type: String,
    enum: ['Available', 'Booked', 'Maintenance'],
    default: 'Available'
  },
  images: [{
    type: String
  }],
  color: {
    type: String,
    trim: true
  },
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  mileage: {
    type: Number,
    default: 0
  },
  features: [{
    type: String
  }],
  description: {
    type: String,
    trim: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  }
}, {
  timestamps: true
});

// Index for search optimization
carSchema.index({ brand: 1, model: 1, availabilityStatus: 1 });
carSchema.index({ pricePerDay: 1 });
carSchema.index({ fuelType: 1 });
carSchema.index({ branch: 1 });

module.exports = mongoose.model('Car', carSchema);
