import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const userId = localStorage.getItem('userId');
  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;

  useEffect(() => {
    if (!userId) {
      alert('Please login to view bookings');
      navigate('/login');
      return;
    }
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/bookings', {
        params: { userId, role: userRole }
      });
      setBookings(response.data.bookings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      await axios.patch(`/api/bookings/${bookingId}/cancel`, {
        userId,
        cancellationReason: reason
      });
      alert('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleReportIssue = (bookingId) => {
    navigate(`/report-issue?bookingId=${bookingId}`);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Pending': 'pending',
      'Confirmed': 'confirmed',
      'Active': 'active',
      'Completed': 'completed',
      'Cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['Pending', 'Confirmed', 'Active'].includes(booking.bookingStatus);
    if (filter === 'completed') return booking.bookingStatus === 'Completed';
    if (filter === 'cancelled') return booking.bookingStatus === 'Cancelled';
    return true;
  });

  if (loading) {
    return <div className="loading">Loading your bookings...</div>;
  }

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <div>
          <h1>My Bookings</h1>
          <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
            <Link to="/dashboard" style={{color: '#3498db', textDecoration: 'none'}}>← Dashboard</Link>
            <Link to="/" style={{color: '#7f8c8d', textDecoration: 'none'}}>← Home</Link>
          </div>
        </div>
        <button onClick={() => navigate('/vehicles')} className="btn-new-booking">
          + New Booking
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({bookings.length})
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active ({bookings.filter(b => ['Pending', 'Confirmed', 'Active'].includes(b.bookingStatus)).length})
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed ({bookings.filter(b => b.bookingStatus === 'Completed').length})
        </button>
        <button
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled ({bookings.filter(b => b.bookingStatus === 'Cancelled').length})
        </button>
      </div>

      <div className="bookings-list">
        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings found</p>
            <button onClick={() => navigate('/vehicles')} className="btn-browse">
              Browse Vehicles
            </button>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-image">
                {booking.car?.images?.[0] ? (
                  <img src={booking.car.images[0]} alt={`${booking.car.brand} ${booking.car.model}`} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>

              <div className="booking-details">
                <div className="booking-header-row">
                  <h3>{booking.car?.brand} {booking.car?.model} ({booking.car?.year})</h3>
                  <span className={`status-badge ${getStatusBadgeClass(booking.bookingStatus)}`}>
                    {booking.bookingStatus}
                  </span>
                </div>

                <div className="booking-info-grid">
                  <div className="info-item">
                    <span className="label">Booking ID:</span>
                    <span className="value">#{booking._id.slice(-8)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Plate Number:</span>
                    <span className="value">{booking.car?.plateNumber}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Pickup Date:</span>
                    <span className="value">{new Date(booking.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Return Date:</span>
                    <span className="value">{new Date(booking.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Pickup Time:</span>
                    <span className="value">{booking.pickupTime}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Duration:</span>
                    <span className="value">{booking.totalDays} day{booking.totalDays > 1 ? 's' : ''}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Pickup Location:</span>
                    <span className="value">{booking.pickupLocation}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Payment Status:</span>
                    <span className={`payment-status ${booking.paymentStatus.toLowerCase()}`}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                </div>

                {booking.purpose && (
                  <div className="booking-purpose">
                    <strong>Purpose:</strong> {booking.purpose}
                  </div>
                )}

                {booking.cancellationReason && (
                  <div className="cancellation-reason">
                    <strong>Cancellation Reason:</strong> {booking.cancellationReason}
                  </div>
                )}

                <div className="booking-price">
                  <span className="price-label">Total Amount:</span>
                  <span className="price-amount">₹{booking.totalPrice}</span>
                  <span className="price-breakdown">
                    (₹{booking.pricePerDay} × {booking.totalDays} day{booking.totalDays > 1 ? 's' : ''})
                  </span>
                </div>

                <div className="booking-actions">
                  {['Pending', 'Confirmed'].includes(booking.bookingStatus) && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="btn-action btn-cancel"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {['Active', 'Completed'].includes(booking.bookingStatus) && (
                    <button
                      onClick={() => handleReportIssue(booking._id)}
                      className="btn-action btn-issue"
                    >
                      Report Issue
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/booking/${booking._id}`)}
                    className="btn-action btn-view"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBookings;
