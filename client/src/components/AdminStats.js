import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminStats.css';

const AdminStats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      alert('Access denied. Admin only.');
      navigate('/');
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading statistics...</div>;
  if (!stats) return <div className="error">Failed to load statistics</div>;

  return (
    <div className="admin-stats-container">
      <div className="stats-header">
        <div className="header-left">
          <h1>🔐 Admin Dashboard</h1>
          <p className="admin-subtitle">System Management & Overview</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/users')} className="btn-action">
            👥 Users
          </button>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-action">
            🚙 Fleet
          </button>
          <button onClick={() => navigate('/profile')} className="btn-action">
            👤 Profile
          </button>
          <button onClick={() => {
            localStorage.clear();
            navigate('/login');
          }} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {/* Vehicles Section */}
      <div className="stats-section">
        <h2>🚗 Vehicle Fleet</h2>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.vehicles.total}</div>
            <div className="stat-label">Total Vehicles</div>
          </div>
          <div className="stat-card available">
            <div className="stat-value">{stats.vehicles.available}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-card rented">
            <div className="stat-value">{stats.vehicles.rented}</div>
            <div className="stat-label">Currently Rented</div>
          </div>
          <div className="stat-card maintenance">
            <div className="stat-value">{stats.vehicles.maintenance}</div>
            <div className="stat-label">In Maintenance</div>
          </div>
        </div>
      </div>

      {/* Bookings Section */}
      <div className="stats-section">
        <h2>📅 Bookings</h2>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.bookings.total}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card daily">
            <div className="stat-value">{stats.bookings.daily}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-card monthly">
            <div className="stat-value">{stats.bookings.monthly}</div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="stat-card active">
            <div className="stat-value">{stats.bookings.active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.bookings.pending}</div>
            <div className="stat-label">Pending Confirmation</div>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="stats-section">
        <h2>💰 Revenue</h2>
        <div className="stats-grid">
          <div className="stat-card revenue-total">
            <div className="stat-value">${stats.revenue.total.toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card revenue-monthly">
            <div className="stat-value">${stats.revenue.monthly.toLocaleString()}</div>
            <div className="stat-label">This Month</div>
          </div>
          <div className="stat-card revenue-average">
            <div className="stat-value">${Math.round(stats.revenue.average)}</div>
            <div className="stat-label">Average Booking Value</div>
          </div>
        </div>
      </div>

      {/* Issues Section */}
      <div className="stats-section">
        <h2>🔧 Issues & Support</h2>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.issues.total}</div>
            <div className="stat-label">Total Issues</div>
          </div>
          <div className="stat-card open">
            <div className="stat-value">{stats.issues.open}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.issues.pending}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-value">{stats.issues.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="stats-section">
        <h2>👥 Users</h2>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.users.total}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card active">
            <div className="stat-value">{stats.users.active}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card verified">
            <div className="stat-value">{stats.users.verified}</div>
            <div className="stat-label">Verified</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.users.pendingVerifications}</div>
            <div className="stat-label">Pending Verification</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => navigate('/admin/users?verificationStatus=Pending')} className="action-btn">
            Review Pending Verifications ({stats.users.pendingVerifications})
          </button>
          <button onClick={() => navigate('/my-bookings?status=Pending')} className="action-btn">
            Confirm Pending Bookings ({stats.bookings.pending})
          </button>
          <button onClick={() => navigate('/my-issues?status=Open')} className="action-btn">
            Review Open Issues ({stats.issues.open})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
