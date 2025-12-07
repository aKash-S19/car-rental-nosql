import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <h2>RentCar Pro</h2>
          </div>
          <div className="nav-links">
            <Link to="/vehicles" className="nav-link">Browse Vehicles</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link signup-btn">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Car Rental Operations Manager</h1>
          <p>
            Streamline your car rental business with our comprehensive management system.
            Handle inventory, bookings, customers, and support all in one place.
          </p>
          <div className="hero-buttons">
            <Link to="/vehicles" className="btn btn-primary">Browse Vehicles</Link>
            <Link to="/login" className="btn btn-secondary">Staff Login</Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="car-placeholder">🚗</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚙</div>
              <h3>Vehicle Management</h3>
              <p>Complete fleet management with real-time availability tracking, maintenance status, and multi-branch assignments</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Booking & Reservations</h3>
              <p>Smart booking system with admin approval workflow, automatic price calculation, and overlapping prevention</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>User Management</h3>
              <p>Role-based access control for admins and customers with document verification and account status management</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Issue Tracking</h3>
              <p>Comprehensive issue management system with priority levels, status tracking, and admin response capabilities</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Notifications</h3>
              <p>Real-time notification system for booking updates, account status changes, and issue responses</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎁</div>
              <h3>Loyalty Rewards</h3>
              <p>Customer loyalty points system with rewards on completed bookings and rental history tracking</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Admin Dashboard</h3>
              <p>Comprehensive analytics with revenue tracking, booking statistics, and user management insights</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏢</div>
              <h3>Multi-Branch Support</h3>
              <p>Manage multiple rental locations with branch-specific vehicle assignments and capacity tracking</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Audit Logging</h3>
              <p>Complete audit trail of all admin actions for security monitoring and accountability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <h2>Why Choose RentCar Pro?</h2>
          <div className="benefits-content">
            <div className="benefit">
              <h3>⚡ Fast & Efficient</h3>
              <p>NoSQL database ensures quick queries and seamless multi-user access</p>
            </div>
            <div className="benefit">
              <h3>🔒 Secure & Reliable</h3>
              <p>Enterprise-grade security with data backup and recovery systems</p>
            </div>
            <div className="benefit">
              <h3>📱 Mobile Friendly</h3>
              <p>Responsive design works perfectly on all devices and screen sizes</p>
            </div>
            <div className="benefit">
              <h3>🎯 Easy to Use</h3>
              <p>Intuitive interface designed for rental business operations</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;