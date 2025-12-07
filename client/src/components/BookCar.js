import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './BookCar.css';

const BookCar = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    pickupTime: '10:00 AM',
    purpose: '',
    specialRequirements: '',
    pickupLocation: 'Main Office',
    returnLocation: 'Main Office',
    driverLicenseNumber: '',
    driverLicenseExpiry: ''
  });

  const [pricing, setPricing] = useState({
    days: 0,
    pricePerDay: 0,
    totalPrice: 0
  });

  const [errors, setErrors] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  useEffect(() => {
    if (!userId) {
      alert('Please login to book a car');
      navigate('/login');
      return;
    }
    fetchCarDetails();
  }, [carId]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      calculatePricing();
      checkAvailability();
    }
  }, [formData.startDate, formData.endDate]);

  const fetchCarDetails = async () => {
    try {
      const response = await axios.get(`/api/cars/${carId}`);
      setCar(response.data.car);
      setPricing(prev => ({ ...prev, pricePerDay: response.data.car.pricePerDay }));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching car:', error);
      alert('Failed to load car details');
      navigate('/vehicles');
    }
  };

  const calculatePricing = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (start && end && end > start) {
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const total = days * (car?.pricePerDay || 0);
      setPricing({
        days,
        pricePerDay: car?.pricePerDay || 0,
        totalPrice: total
      });
    }
  };

  const checkAvailability = async () => {
    if (!formData.startDate || !formData.endDate) return;

    setCheckingAvailability(true);
    setAvailabilityMessage('');

    try {
      const response = await axios.get('/api/bookings/availability/check', {
        params: {
          carId,
          startDate: formData.startDate,
          endDate: formData.endDate
        }
      });

      if (response.data.available) {
        setAvailabilityMessage('✓ Car is available for selected dates');
      } else {
        setAvailabilityMessage('✗ Car is not available for selected dates');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (new Date(formData.startDate) < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.pickupTime) {
      newErrors.pickupTime = 'Pickup time is required';
    }

    if (!formData.driverLicenseNumber) {
      newErrors.driverLicenseNumber = 'Driver license number is required';
    }

    if (!formData.driverLicenseExpiry) {
      newErrors.driverLicenseExpiry = 'License expiry date is required';
    } else if (new Date(formData.driverLicenseExpiry) < today) {
      newErrors.driverLicenseExpiry = 'Driver license has expired';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (availabilityMessage.includes('not available')) {
      alert('Please select different dates - car is not available');
      return;
    }

    try {
      setLoading(true);

      const bookingData = {
        userId,
        carId,
        ...formData,
        driverLicense: {
          number: formData.driverLicenseNumber,
          expiryDate: formData.driverLicenseExpiry
        }
      };

      const response = await axios.post('/api/bookings/create', bookingData);

      alert('Booking created successfully! Awaiting admin confirmation.');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
      setLoading(false);
    }
  };

  if (loading && !car) {
    return <div className="loading">Loading...</div>;
  }

  if (!car) {
    return <div className="error">Car not found</div>;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="book-car-container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        <h1 style={{margin: 0, color: '#2c3e50'}}>Book Your Ride</h1>
        <div style={{display: 'flex', gap: '10px'}}>
          {user.id && <Link to="/dashboard" style={{color: '#3498db', textDecoration: 'none', padding: '8px 16px', background: '#e3f2fd', borderRadius: '5px', fontWeight: '600'}}>← Dashboard</Link>}
          <Link to="/" style={{color: '#7f8c8d', textDecoration: 'none', padding: '8px 16px', background: '#ecf0f1', borderRadius: '5px', fontWeight: '600'}}>← Home</Link>
        </div>
      </div>
      <div className="book-car-content">
        {/* Car Summary Section */}
        <div className="car-summary">
          <h2>Book Your Ride</h2>
          <div className="car-summary-card">
            {car.images && car.images[0] && (
              <img src={car.images[0]} alt={`${car.brand} ${car.model}`} />
            )}
            <h3>{car.brand} {car.model} ({car.year})</h3>
            <div className="car-quick-specs">
              <span>🔧 {car.transmission}</span>
              <span>⛽ {car.fuelType}</span>
              <span>👥 {car.seatingCapacity} Seats</span>
            </div>
            <div className="price-display">
              <span className="price">₹{car.pricePerDay}</span>
              <span className="unit">/day</span>
            </div>

            {pricing.days > 0 && (
              <div className="pricing-breakdown">
                <h4>Pricing Breakdown</h4>
                <div className="pricing-row">
                  <span>₹{pricing.pricePerDay} × {pricing.days} day{pricing.days > 1 ? 's' : ''}</span>
                  <span className="pricing-total">₹{pricing.totalPrice}</span>
                </div>
                <div className="pricing-total-row">
                  <strong>Total Amount</strong>
                  <strong>₹{pricing.totalPrice}</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Form Section */}
        <div className="booking-form-section">
          <form onSubmit={handleSubmit} className="booking-form">
            <h3>Booking Details</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                {errors.startDate && <span className="error-text">{errors.startDate}</span>}
              </div>

              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
                {errors.endDate && <span className="error-text">{errors.endDate}</span>}
              </div>
            </div>

            {availabilityMessage && (
              <div className={`availability-message ${availabilityMessage.includes('✓') ? 'available' : 'unavailable'}`}>
                {checkingAvailability ? 'Checking availability...' : availabilityMessage}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Pickup Time *</label>
                <select
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  required
                >
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>

              <div className="form-group">
                <label>Pickup Location</label>
                <select
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                >
                  <option value="Main Office">Main Office</option>
                  <option value="Airport">Airport</option>
                  <option value="Train Station">Train Station</option>
                  <option value="Hotel Delivery">Hotel Delivery</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Return Location</label>
              <select
                name="returnLocation"
                value={formData.returnLocation}
                onChange={handleChange}
              >
                <option value="Main Office">Main Office</option>
                <option value="Airport">Airport</option>
                <option value="Train Station">Train Station</option>
                <option value="Hotel Pickup">Hotel Pickup</option>
              </select>
            </div>

            <h4>Driver Information</h4>

            <div className="form-row">
              <div className="form-group">
                <label>Driver License Number *</label>
                <input
                  type="text"
                  name="driverLicenseNumber"
                  value={formData.driverLicenseNumber}
                  onChange={handleChange}
                  placeholder="e.g., DL-1234567890"
                  required
                />
                {errors.driverLicenseNumber && <span className="error-text">{errors.driverLicenseNumber}</span>}
              </div>

              <div className="form-group">
                <label>License Expiry Date *</label>
                <input
                  type="date"
                  name="driverLicenseExpiry"
                  value={formData.driverLicenseExpiry}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                {errors.driverLicenseExpiry && <span className="error-text">{errors.driverLicenseExpiry}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Purpose of Rental</label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="e.g., Business trip, Family vacation, Wedding"
              />
            </div>

            <div className="form-group">
              <label>Special Requirements</label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                rows="3"
                placeholder="Any special requests or requirements..."
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading || (availabilityMessage && availabilityMessage.includes('not available'))}
              >
                {loading ? 'Processing...' : `Book Now - ₹${pricing.totalPrice}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookCar;
