import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    loyaltyPoints: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchDashboardData(userData.id);
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch bookings
      const bookingsResponse = await axios.get(
        `http://localhost:5000/api/bookings?userId=${userId}&role=customer`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const bookings = bookingsResponse.data.bookings || [];
      const activeCount = bookings.filter(b => 
        ['Confirmed', 'Active'].includes(b.bookingStatus)
      ).length;
      const completedCount = bookings.filter(b => 
        b.bookingStatus === 'Completed'
      ).length;

      setStats({
        totalBookings: bookings.length,
        activeBookings: activeCount,
        completedBookings: completedCount,
        loyaltyPoints: bookingsResponse.data.user?.loyaltyPoints || 0
      });

      setRecentBookings(bookings.slice(0, 5));

      // Fetch notifications - wrapped in try-catch to prevent blocking
      try {
        const notificationsResponse = await axios.get(
          'http://localhost:5000/api/notifications?limit=5',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications(notificationsResponse.data.notifications || []);
      } catch (notifError) {
        console.log('Notifications not available yet:', notifError.message);
        setNotifications([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div className="customer-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>👋 Welcome, {user?.name}!</h1>
          <p className="subtitle">Your Car Rental Dashboard</p>
        </div>
        <div className="header-right">
          <button onClick={() => navigate('/profile')} className="btn-profile">
            👤 Profile
          </button>
          <button onClick={() => navigate('/notifications')} className="btn-notifications">
            🔔 Notifications
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="badge">{notifications.filter(n => !n.isRead).length}</span>
            )}
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card bookings-total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        </div>
        <div className="stat-card bookings-active">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <h3>{stats.activeBookings}</h3>
            <p>Active Rentals</p>
          </div>
        </div>
        <div className="stat-card bookings-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedBookings}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card loyalty-points">
          <div className="stat-icon">🎁</div>
          <div className="stat-content">
            <h3>{stats.loyaltyPoints}</h3>
            <p>Loyalty Points</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button onClick={() => navigate('/vehicles')} className="action-card browse">
            <div className="action-icon">🚙</div>
            <h3>Browse Vehicles</h3>
            <p>Find your perfect ride</p>
          </button>
          <button onClick={() => navigate('/my-bookings')} className="action-card bookings">
            <div className="action-icon">📅</div>
            <h3>My Bookings</h3>
            <p>View rental history</p>
          </button>
          <button onClick={() => navigate('/report-issue')} className="action-card issues">
            <div className="action-icon">🔧</div>
            <h3>Report Issue</h3>
            <p>Need assistance?</p>
          </button>
          <button onClick={() => navigate('/documents')} className="action-card docs">
            <div className="action-icon">📄</div>
            <h3>My Documents</h3>
            <p>Manage verification</p>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-content">
        {/* Recent Bookings */}
        <div className="content-section">
          <div className="section-header">
            <h2>Recent Bookings</h2>
            <button onClick={() => navigate('/my-bookings')} className="btn-view-all">
              View All →
            </button>
          </div>
          <div className="bookings-list">
            {recentBookings.length === 0 ? (
              <div className="empty-state">
                <p>No bookings yet</p>
                <button onClick={() => navigate('/vehicles')} className="btn-primary">
                  Browse Vehicles
                </button>
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking._id} className="booking-item">
                  <div className="booking-car">
                    <h4>{booking.car?.brand} {booking.car?.model}</h4>
                    <p className="booking-dates">
                      {new Date(booking.startDate).toLocaleDateString()} - 
                      {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge status-${booking.bookingStatus.toLowerCase()}`}>
                      {booking.bookingStatus}
                    </span>
                    <p className="booking-price">${booking.totalPrice}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="content-section">
          <div className="section-header">
            <h2>Recent Notifications</h2>
            <button onClick={() => navigate('/notifications')} className="btn-view-all">
              View All →
            </button>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification._id} className={`notification-item ${!notification.isRead ? 'unread' : ''}`}>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      {user && user.verificationStatus !== 'Verified' && (
        <div className="verification-banner">
          <div className="banner-content">
            <h3>⚠️ Account Verification Required</h3>
            <p>
              Please upload your documents to verify your account and unlock all features.
            </p>
            <button onClick={() => navigate('/documents')} className="btn-verify">
              Upload Documents
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
