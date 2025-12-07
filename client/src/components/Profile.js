import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    driverLicense: {
      number: '',
      expiryDate: '',
      issuedState: ''
    },
    notificationPreferences: {
      email: true,
      sms: false,
      bookingReminders: true
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
      setFormData({
        name: response.data.name,
        phone: response.data.phone,
        address: response.data.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        driverLicense: response.data.driverLicense || {
          number: '',
          expiryDate: '',
          issuedState: ''
        },
        notificationPreferences: response.data.notificationPreferences || {
          email: true,
          sms: false,
          bookingReminders: true
        }
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [name]: checked
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/profile',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser(response.data.user);
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const getVerificationBadge = () => {
    if (!user) return null;
    const status = user.verificationStatus;
    const colors = {
      'Verified': 'green',
      'Pending': 'orange',
      'Rejected': 'red',
      'Not Verified': 'gray'
    };
    return (
      <span className={`badge badge-${colors[status]}`}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!user) return <div className="error">Failed to load profile</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="profile-actions">
          <button onClick={() => navigate('/vehicles')} className="btn-secondary">
            Back to Vehicles
          </button>
          <button onClick={() => navigate('/notifications')} className="btn-secondary">
            Notifications
          </button>
          <button onClick={() => navigate('/documents')} className="btn-secondary">
            My Documents
          </button>
        </div>
      </div>

      <div className="profile-grid">
        {/* User Info Card */}
        <div className="profile-card">
          <div className="card-header">
            <h2>Account Information</h2>
            {!editMode && (
              <button onClick={() => setEditMode(true)} className="btn-edit">
                Edit Profile
              </button>
            )}
          </div>
          
          <div className="profile-info">
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="label">Role:</span>
              <span className="value badge badge-blue">{user.role}</span>
            </div>
            <div className="info-row">
              <span className="label">Verification Status:</span>
              {getVerificationBadge()}
            </div>
            <div className="info-row">
              <span className="label">Account Status:</span>
              <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Loyalty Card */}
        <div className="profile-card loyalty-card">
          <h2>Loyalty Rewards</h2>
          <div className="loyalty-stats">
            <div className="stat">
              <div className="stat-value">{user.loyaltyPoints || 0}</div>
              <div className="stat-label">Points</div>
            </div>
            <div className="stat">
              <div className="stat-value">{user.totalBookings || 0}</div>
              <div className="stat-label">Bookings</div>
            </div>
          </div>
          <p className="loyalty-info">Earn 10 points for every completed booking!</p>
        </div>

        {/* Profile Form */}
        {editMode ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Address</h3>
              <div className="form-group">
                <label>Street</label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Zip Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Driver License</h3>
              <div className="form-group">
                <label>License Number</label>
                <input
                  type="text"
                  name="driverLicense.number"
                  value={formData.driverLicense.number}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    name="driverLicense.expiryDate"
                    value={formData.driverLicense.expiryDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Issued State</label>
                  <input
                    type="text"
                    name="driverLicense.issuedState"
                    value={formData.driverLicense.issuedState}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Notification Preferences</h3>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="email"
                    checked={formData.notificationPreferences.email}
                    onChange={handleCheckboxChange}
                  />
                  Email Notifications
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="sms"
                    checked={formData.notificationPreferences.sms}
                    onChange={handleCheckboxChange}
                  />
                  SMS Notifications
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="bookingReminders"
                    checked={formData.notificationPreferences.bookingReminders}
                    onChange={handleCheckboxChange}
                  />
                  Booking Reminders
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Save Changes</button>
              <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-section">
              <h3>Contact Information</h3>
              <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
              {user.address && (
                <>
                  <p><strong>Address:</strong></p>
                  <p>{user.address.street}</p>
                  <p>{user.address.city}, {user.address.state} {user.address.zipCode}</p>
                  <p>{user.address.country}</p>
                </>
              )}
            </div>

            {user.driverLicense && (
              <div className="detail-section">
                <h3>Driver License</h3>
                <p><strong>Number:</strong> {user.driverLicense.number || 'Not provided'}</p>
                <p><strong>Expiry:</strong> {user.driverLicense.expiryDate ? new Date(user.driverLicense.expiryDate).toLocaleDateString() : 'Not provided'}</p>
                <p><strong>State:</strong> {user.driverLicense.issuedState || 'Not provided'}</p>
                <p>
                  <strong>Verified:</strong> 
                  <span className={`badge ${user.driverLicense.verified ? 'badge-green' : 'badge-gray'}`}>
                    {user.driverLicense.verified ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
