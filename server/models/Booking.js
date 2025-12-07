const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  returnTime: {
    type: String,
    default: '10:00 AM'
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  bookingStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Pending'
  },
  purpose: {
    type: String,
    trim: true
  },
  specialRequirements: {
    type: String,
    trim: true
  },
  pickupLocation: {
    type: String,
    default: 'Main Office'
  },
  returnLocation: {
    type: String,
    default: 'Main Office'
  },
  driverLicense: {
    number: String,
    expiryDate: Date
  },
  additionalDrivers: [{
    name: String,
    license: String
  }],
  // Pickup and Return tracking
  actualPickupDate: Date,
  actualReturnDate: Date,
  mileageAtPickup: Number,
  mileageAtReturn: Number,
  fuelLevelAtPickup: {
    type: String,
    enum: ['Empty', 'Quarter', 'Half', 'Three-Quarter', 'Full']
  },
  fuelLevelAtReturn: {
    type: String,
    enum: ['Empty', 'Quarter', 'Half', 'Three-Quarter', 'Full']
  },
  // Notes and issues
  pickupNotes: String,
  returnNotes: String,
  damageReported: {
    type: Boolean,
    default: false
  },
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ car: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ bookingStatus: 1 });

// Method to check if booking overlaps with existing bookings
bookingSchema.statics.checkAvailability = async function(carId, startDate, endDate, excludeBookingId = null) {
  const query = {
    car: carId,
    bookingStatus: { $in: ['Pending', 'Confirmed', 'Active'] },
    $or: [
      // New booking starts during existing booking
      { startDate: { $lte: startDate }, endDate: { $gte: startDate } },
      // New booking ends during existing booking
      { startDate: { $lte: endDate }, endDate: { $gte: endDate } },
      // New booking completely contains existing booking
      { startDate: { $gte: startDate }, endDate: { $lte: endDate } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBookings = await this.find(query);
  return conflictingBookings.length === 0;
};

module.exports = mongoose.model('Booking', bookingSchema);
