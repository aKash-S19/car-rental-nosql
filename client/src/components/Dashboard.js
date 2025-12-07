import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Overview stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    loyaltyPoints: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  
  // Data lists
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('all'); // all, pending, confirmed, active, completed
  const [issueFilter, setIssueFilter] = useState('all'); // all, open, in-progress, resolved
  
  // Issue form
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    issueType: 'Service Complaint',
    priority: 'Medium'
  });
  
  // Vehicle form
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    brand: '',
    model: '',
    year: '',
    seatingCapacity: '',
    fuelType: 'Petrol',
    transmission: 'Manual',
    dailyRate: '',
    mileage: '',
    availabilityStatus: 'Available'
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchDashboardData(userData);
  }, [navigate]);

  const fetchDashboardData = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (userData.role === 'admin') {
        // Admin: Fetch all stats
        const statsRes = await axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats({
          totalVehicles: statsRes.data.vehicles.total,
          availableVehicles: statsRes.data.vehicles.available,
          totalBookings: statsRes.data.bookings.total,
          activeBookings: statsRes.data.bookings.active,
          pendingBookings: statsRes.data.bookings.pending || 0,
          totalRevenue: statsRes.data.revenue.total,
          totalUsers: statsRes.data.users.total
        });
      } else {
        // Customer: Fetch personal stats
        const bookingsRes = await axios.get(
          `http://localhost:5000/api/bookings?userId=${userData.id}&role=customer`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const bookings = bookingsRes.data.bookings || [];
        setStats({
          totalBookings: bookings.length,
          activeBookings: bookings.filter(b => ['Confirmed', 'Active'].includes(b.bookingStatus)).length,
          completedBookings: bookings.filter(b => b.bookingStatus === 'Completed').length,
          loyaltyPoints: bookingsRes.data.user?.loyaltyPoints || 0
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/cars');
      console.log('Vehicles API response:', response.data);
      
      // API returns { success: true, cars: [...] }
      const vehiclesData = response.data.cars || [];
      console.log('Vehicles extracted:', vehiclesData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/bookings';
      
      // For admin, get all bookings (pass role=admin)
      // For customer, get only their bookings
      if (user.role === 'admin') {
        url += `?role=admin`;
      } else {
        url += `?userId=${user.id}&role=customer`;
      }
      
      console.log('Fetching bookings from:', url);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Bookings API response:', response.data);
      
      // API returns { success: true, bookings: [...] }
      const bookingsData = response.data.bookings || [];
      console.log('Bookings extracted:', bookingsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/issues';
      
      if (user.role === 'customer') {
        url += `?userId=${user.id}&role=customer`;
      } else {
        url += `?role=admin`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/cars', vehicleForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Vehicle added successfully!');
      setShowVehicleForm(false);
      setVehicleForm({
        brand: '', model: '', year: '', seatingCapacity: '', 
        fuelType: 'Petrol', transmission: 'Manual', dailyRate: '', 
        mileage: '', availabilityStatus: 'Available'
      });
      fetchVehicles();
      fetchDashboardData(user);
    } catch (error) {
      alert('Error adding vehicle: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteVehicle = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/cars/${carId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Vehicle deleted successfully!');
      fetchVehicles();
      fetchDashboardData(user);
    } catch (error) {
      alert('Error deleting vehicle: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = user.id;
      
      await axios.patch(`http://localhost:5000/api/bookings/${bookingId}/confirm`, 
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Booking approved successfully!');
      fetchBookings();
      fetchDashboardData(user);
    } catch (error) {
      alert('Error approving booking: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('token');
      const userId = user.id;
      
      await axios.patch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, 
        { cancellationReason: reason, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Booking rejected successfully!');
      fetchBookings();
      fetchDashboardData(user);
    } catch (error) {
      alert('Error rejecting booking: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`User ${action}d successfully!`);
      fetchUsers();
    } catch (error) {
      alert('Error updating user status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/issues/create', 
        { ...issueForm, userId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Issue reported successfully!');
      setShowIssueForm(false);
      setIssueForm({
        title: '',
        description: '',
        issueType: 'Service Complaint',
        priority: 'Medium'
      });
      fetchIssues();
    } catch (error) {
      alert('Error creating issue: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateIssueStatus = async (issueId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const userId = user.id;
      
      await axios.patch(
        `http://localhost:5000/api/issues/${issueId}/status`,
        { status: newStatus, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Issue status updated!');
      fetchIssues();
    } catch (error) {
      alert('Error updating issue: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    if (activeTab === 'vehicles' && user) {
      console.log('Vehicles tab active, fetching vehicles...');
      fetchVehicles();
    }
    if (activeTab === 'bookings' && user) {
      console.log('Bookings tab active, fetching bookings...');
      fetchBookings();
    }
    if (activeTab === 'users' && user?.role === 'admin') {
      console.log('Users tab active, fetching users...');
      fetchUsers();
    }
    if (activeTab === 'issues' && user) {
      console.log('Issues tab active, fetching issues...');
      fetchIssues();
    }
  }, [activeTab, user]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className={`dashboard-header ${user?.role === 'admin' ? 'admin-header' : 'customer-header'}`}>
        <div className="header-left">
          <button onClick={() => navigate('/')} className="btn-back">← Home</button>
          <div>
            <h1>{user?.role === 'admin' ? '🔐 Admin Dashboard' : '👋 Welcome, ' + user?.name}</h1>
            <p>{user?.role === 'admin' ? 'System Management' : 'Your Car Rental Hub'}</p>
          </div>
        </div>
        <div className="header-right">
          <button onClick={() => navigate('/profile')} className="btn-header">👤 Profile</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'vehicles' ? 'active' : ''} 
          onClick={() => setActiveTab('vehicles')}
        >
          🚗 Vehicles
        </button>
        <button 
          className={activeTab === 'bookings' ? 'active' : ''} 
          onClick={() => setActiveTab('bookings')}
        >
          📅 Bookings
        </button>
        {user?.role === 'admin' && (
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
        )}
        <button 
          className={activeTab === 'issues' ? 'active' : ''} 
          onClick={() => setActiveTab('issues')}
        >
          🔧 {user?.role === 'admin' ? 'Issues' : 'My Issues'}
        </button>
      </nav>

      {/* Content Area */}
      <div className="dashboard-content">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Dashboard Overview</h2>
            <div className="stats-grid">
              {user?.role === 'admin' ? (
                <>
                  <div className="stat-card">
                    <div className="stat-icon">🚗</div>
                    <div className="stat-info">
                      <h3>{stats.totalVehicles}</h3>
                      <p>Total Vehicles</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <h3>{stats.availableVehicles}</h3>
                      <p>Available</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                      <h3>{stats.totalBookings}</h3>
                      <p>Total Bookings</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-info">
                      <h3>{stats.activeBookings}</h3>
                      <p>Active Bookings</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                      <h3>${stats.totalRevenue}</h3>
                      <p>Total Revenue</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <h3>{stats.totalUsers}</h3>
                      <p>Total Users</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                      <h3>{stats.totalBookings}</h3>
                      <p>Total Bookings</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🚗</div>
                    <div className="stat-info">
                      <h3>{stats.activeBookings}</h3>
                      <p>Active Rentals</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <h3>{stats.completedBookings}</h3>
                      <p>Completed</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎁</div>
                    <div className="stat-info">
                      <h3>{stats.loyaltyPoints}</h3>
                      <p>Loyalty Points</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                {user?.role === 'admin' && (
                  <>
                    <button onClick={() => {
                      setActiveTab('vehicles');
                      setShowVehicleForm(true);
                    }} className="action-btn add-vehicle-btn">
                      ➕ Add New Vehicle
                    </button>
                    <button onClick={() => setActiveTab('users')} className="action-btn">
                      👥 Manage Users
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('bookings');
                        setBookingFilter('pending');
                        fetchBookings();
                      }} 
                      className="action-btn pending-btn"
                    >
                      📋 Pending Approvals ({stats.pendingBookings || 0})
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('vehicles');
                        fetchVehicles();
                      }} 
                      className="action-btn"
                    >
                      🚗 View All Vehicles ({stats.totalVehicles || 0})
                    </button>
                  </>
                )}
                <button onClick={() => navigate('/vehicles')} className="action-btn">
                  🔍 Browse Vehicles
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('bookings');
                    setBookingFilter('all');
                    fetchBookings();
                  }} 
                  className="action-btn"
                >
                  📋 View Bookings
                </button>
                {user?.role === 'customer' && (
                  <button onClick={() => navigate('/report-issue')} className="action-btn">
                    🔧 Report Issue
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VEHICLES TAB */}
        {activeTab === 'vehicles' && (
          <div className="vehicles-section">
            <div className="section-header">
              <h2>Vehicle Management</h2>
              {user?.role === 'admin' && (
                <button onClick={() => setShowVehicleForm(!showVehicleForm)} className="btn-primary">
                  {showVehicleForm ? '❌ Cancel' : '➕ Add Vehicle'}
                </button>
              )}
            </div>

            {showVehicleForm && user?.role === 'admin' && (
              <form className="vehicle-form" onSubmit={handleAddVehicle}>
                <div className="form-row">
                  <input type="text" placeholder="Brand" value={vehicleForm.brand} 
                    onChange={(e) => setVehicleForm({...vehicleForm, brand: e.target.value})} required />
                  <input type="text" placeholder="Model" value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})} required />
                  <input type="number" placeholder="Year" value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})} required />
                </div>
                <div className="form-row">
                  <input type="number" placeholder="Seating Capacity" value={vehicleForm.seatingCapacity}
                    onChange={(e) => setVehicleForm({...vehicleForm, seatingCapacity: e.target.value})} required />
                  <select value={vehicleForm.fuelType} onChange={(e) => setVehicleForm({...vehicleForm, fuelType: e.target.value})}>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  <select value={vehicleForm.transmission} onChange={(e) => setVehicleForm({...vehicleForm, transmission: e.target.value})}>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                  </select>
                </div>
                <div className="form-row">
                  <input type="number" placeholder="Daily Rate ($)" value={vehicleForm.dailyRate}
                    onChange={(e) => setVehicleForm({...vehicleForm, dailyRate: e.target.value})} required />
                  <input type="number" placeholder="Mileage (km/l)" value={vehicleForm.mileage}
                    onChange={(e) => setVehicleForm({...vehicleForm, mileage: e.target.value})} required />
                </div>
                <button type="submit" className="btn-submit">Add Vehicle</button>
              </form>
            )}

            <div className="vehicles-list">
              {console.log('Rendering vehicles, count:', vehicles.length, 'Data:', vehicles)}
              {!Array.isArray(vehicles) || vehicles.length === 0 ? (
                <p className="empty-state">No vehicles found. {user?.role === 'admin' && 'Add your first vehicle!'}</p>
              ) : (
                <div className="vehicles-grid">
                  {console.log('Mapping over vehicles...')}
                  {vehicles.map(vehicle => {
                    console.log('Rendering vehicle:', vehicle);
                    return (
                    <div key={vehicle._id} className="vehicle-card">
                      <div className="vehicle-header">
                        <h3>{vehicle.brand} {vehicle.model}</h3>
                        <span className={`status-badge ${vehicle.availabilityStatus.toLowerCase()}`}>
                          {vehicle.availabilityStatus}
                        </span>
                      </div>
                      <div className="vehicle-details">
                        <p>🗓️ Year: {vehicle.year}</p>
                        <p>👥 Seats: {vehicle.seatingCapacity}</p>
                        <p>⛽ Fuel: {vehicle.fuelType}</p>
                        <p>⚙️ {vehicle.transmission}</p>
                        <p className="price">💰 ${vehicle.dailyRate || vehicle.pricePerDay}/day</p>
                        {user?.role === 'customer' && vehicle.availabilityStatus !== 'Available' && vehicle.nextAvailableDate && (
                          <p className="next-available">📅 Available from: {new Date(vehicle.nextAvailableDate).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="vehicle-actions">
                        {user?.role === 'customer' && vehicle.availabilityStatus === 'Available' && (
                          <button onClick={() => navigate(`/book/${vehicle._id}`)} className="btn-book">
                            📅 Book Now
                          </button>
                        )}
                        {user?.role === 'customer' && vehicle.availabilityStatus !== 'Available' && (
                          <span style={{color: '#e74c3c', fontWeight: 'bold'}}>Not Available</span>
                        )}
                        {user?.role === 'admin' && (
                          <button onClick={() => handleDeleteVehicle(vehicle._id)} className="btn-delete">
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <div className="section-header">
              <h2>{user?.role === 'admin' ? 'All Bookings' : 'My Bookings'}</h2>
              {user?.role === 'admin' && (
                <div className="filter-buttons">
                  <button 
                    className={bookingFilter === 'all' ? 'filter-active' : ''} 
                    onClick={() => setBookingFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={bookingFilter === 'pending' ? 'filter-active' : ''} 
                    onClick={() => setBookingFilter('pending')}
                  >
                    Pending ({bookings.filter(b => b.bookingStatus === 'Pending').length})
                  </button>
                  <button 
                    className={bookingFilter === 'confirmed' ? 'filter-active' : ''} 
                    onClick={() => setBookingFilter('confirmed')}
                  >
                    Confirmed
                  </button>
                  <button 
                    className={bookingFilter === 'active' ? 'filter-active' : ''} 
                    onClick={() => setBookingFilter('active')}
                  >
                    Active
                  </button>
                  <button 
                    className={bookingFilter === 'completed' ? 'filter-active' : ''} 
                    onClick={() => setBookingFilter('completed')}
                  >
                    Completed
                  </button>
                </div>
              )}
            </div>
            <div className="bookings-list">
              {bookings.filter(booking => {
                if (bookingFilter === 'all') return true;
                return booking.bookingStatus.toLowerCase() === bookingFilter.toLowerCase();
              }).length === 0 ? (
                <p className="empty-state">No {bookingFilter !== 'all' ? bookingFilter : ''} bookings found.</p>
              ) : (
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Total Price</th>
                      <th>Status</th>
                      {user?.role === 'admin' && <th>Customer</th>}
                      {user?.role === 'admin' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.filter(booking => {
                      if (bookingFilter === 'all') return true;
                      return booking.bookingStatus.toLowerCase() === bookingFilter.toLowerCase();
                    }).map(booking => (
                      <tr key={booking._id}>
                        <td>{booking.car?.brand} {booking.car?.model}</td>
                        <td>{new Date(booking.startDate).toLocaleDateString()}</td>
                        <td>{new Date(booking.endDate).toLocaleDateString()}</td>
                        <td>${booking.totalPrice}</td>
                        <td>
                          <span className={`status-badge ${booking.bookingStatus.toLowerCase()}`}>
                            {booking.bookingStatus}
                          </span>
                        </td>
                        {user?.role === 'admin' && <td>{booking.customer?.name || 'N/A'}</td>}
                        {user?.role === 'admin' && (
                          <td>
                            {booking.bookingStatus === 'Pending' && (
                              <div style={{display: 'flex', gap: '5px'}}>
                                <button 
                                  onClick={() => handleApproveBooking(booking._id)} 
                                  className="btn-approve"
                                  style={{padding: '5px 10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
                                >
                                  ✓ Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectBooking(booking._id)} 
                                  className="btn-reject"
                                  style={{padding: '5px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* USERS TAB (Admin Only) */}
        {activeTab === 'users' && user?.role === 'admin' && (
          <div className="users-section">
            <h2>User Management</h2>
            <div className="users-list">
              {users.length === 0 ? (
                <p className="empty-state">No users found.</p>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Bookings</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                        <td><span className={u.isActive ? 'active' : 'inactive'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>{u.totalBookings || 0}</td>
                        <td>
                          <button 
                            onClick={() => handleToggleUserStatus(u._id, u.isActive)}
                            style={{
                              padding: '5px 10px',
                              background: u.isActive ? '#e74c3c' : '#27ae60',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="issues-section">
            <div className="section-header">
              <h2>{user?.role === 'admin' ? 'Issue Management' : 'My Issues'}</h2>
              {user?.role === 'customer' && (
                <button onClick={() => setShowIssueForm(!showIssueForm)} className="btn-primary">
                  {showIssueForm ? '❌ Cancel' : '➕ Report Issue'}
                </button>
              )}
            </div>

            {showIssueForm && user?.role === 'customer' && (
              <form className="issue-form" onSubmit={handleCreateIssue} style={{background: 'white', padding: '25px', borderRadius: '10px', marginBottom: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)'}}>
                <div className="form-row">
                  <input 
                    type="text" 
                    placeholder="Issue Title" 
                    value={issueForm.title}
                    onChange={(e) => setIssueForm({...issueForm, title: e.target.value})} 
                    required 
                    style={{flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '5px'}}
                  />
                </div>
                <div className="form-row" style={{marginTop: '15px'}}>
                  <select 
                    value={issueForm.issueType} 
                    onChange={(e) => setIssueForm({...issueForm, issueType: e.target.value})}
                    style={{flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '5px', marginRight: '10px'}}
                  >
                    <option value="Service Complaint">Service Complaint</option>
                    <option value="Vehicle Damage">Vehicle Damage</option>
                    <option value="Mechanical Problem">Mechanical Problem</option>
                    <option value="Billing Issue">Billing Issue</option>
                    <option value="Other">Other</option>
                  </select>
                  <select 
                    value={issueForm.priority} 
                    onChange={(e) => setIssueForm({...issueForm, priority: e.target.value})}
                    style={{flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '5px'}}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-row" style={{marginTop: '15px'}}>
                  <textarea 
                    placeholder="Describe the issue in detail..." 
                    value={issueForm.description}
                    onChange={(e) => setIssueForm({...issueForm, description: e.target.value})} 
                    required
                    rows="5"
                    style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', resize: 'vertical'}}
                  />
                </div>
                <button type="submit" className="btn-submit" style={{marginTop: '15px', padding: '12px 30px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600'}}>
                  Submit Issue
                </button>
              </form>
            )}

            {user?.role === 'admin' && (
              <div className="filter-buttons" style={{marginBottom: '20px', display: 'flex', gap: '10px'}}>
                <button 
                  className={issueFilter === 'all' ? 'filter-active' : ''} 
                  onClick={() => setIssueFilter('all')}
                  style={{padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: issueFilter === 'all' ? '#3498db' : '#ecf0f1', color: issueFilter === 'all' ? 'white' : '#2c3e50', fontWeight: '600'}}
                >
                  All
                </button>
                <button 
                  className={issueFilter === 'open' ? 'filter-active' : ''} 
                  onClick={() => setIssueFilter('open')}
                  style={{padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: issueFilter === 'open' ? '#3498db' : '#ecf0f1', color: issueFilter === 'open' ? 'white' : '#2c3e50', fontWeight: '600'}}
                >
                  Open
                </button>
                <button 
                  className={issueFilter === 'in progress' ? 'filter-active' : ''} 
                  onClick={() => setIssueFilter('in progress')}
                  style={{padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: issueFilter === 'in progress' ? '#3498db' : '#ecf0f1', color: issueFilter === 'in progress' ? 'white' : '#2c3e50', fontWeight: '600'}}
                >
                  In Progress
                </button>
                <button 
                  className={issueFilter === 'resolved' ? 'filter-active' : ''} 
                  onClick={() => setIssueFilter('resolved')}
                  style={{padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: issueFilter === 'resolved' ? '#3498db' : '#ecf0f1', color: issueFilter === 'resolved' ? 'white' : '#2c3e50', fontWeight: '600'}}
                >
                  Resolved
                </button>
              </div>
            )}

            <div className="issues-list">
              {issues.length === 0 ? (
                <p className="empty-state">No issues found.</p>
              ) : (
                <div className="issues-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
                  {issues.filter(issue => {
                    if (issueFilter === 'all') return true;
                    return issue.status.toLowerCase() === issueFilter.toLowerCase();
                  }).map(issue => (
                    <div key={issue._id} className="issue-card" style={{background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)'}}>
                      <div style={{marginBottom: '15px'}}>
                        <h3 style={{margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.1em'}}>{issue.title}</h3>
                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                          <span className={`status-badge ${issue.status.toLowerCase().replace(' ', '-')}`} style={{padding: '4px 12px', borderRadius: '15px', fontSize: '0.85em', fontWeight: '600', background: issue.status === 'Open' ? '#f39c12' : issue.status === 'In Progress' ? '#3498db' : '#27ae60', color: 'white'}}>
                            {issue.status}
                          </span>
                          <span className={`priority-badge ${issue.priority.toLowerCase()}`} style={{padding: '4px 12px', borderRadius: '15px', fontSize: '0.85em', fontWeight: '600', background: issue.priority === 'Critical' ? '#e74c3c' : issue.priority === 'High' ? '#f39c12' : issue.priority === 'Medium' ? '#3498db' : '#95a5a6', color: 'white'}}>
                            {issue.priority}
                          </span>
                        </div>
                      </div>
                      <p style={{color: '#7f8c8d', fontSize: '0.9em', marginBottom: '10px'}}>{issue.issueType}</p>
                      <p style={{color: '#555', marginBottom: '15px', lineHeight: '1.5'}}>{issue.description}</p>
                      {user?.role === 'admin' && (
                        <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ecf0f1'}}>
                          <p style={{fontSize: '0.9em', color: '#7f8c8d', marginBottom: '10px'}}>Reported by: {issue.customer?.name || 'Unknown'}</p>
                          <div style={{display: 'flex', gap: '10px'}}>
                            {issue.status === 'Open' && (
                              <button 
                                onClick={() => handleUpdateIssueStatus(issue._id, 'In Progress')}
                                style={{flex: 1, padding: '8px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9em'}}
                              >
                                Start Working
                              </button>
                            )}
                            {issue.status === 'In Progress' && (
                              <button 
                                onClick={() => handleUpdateIssueStatus(issue._id, 'Resolved')}
                                style={{flex: 1, padding: '8px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9em'}}
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <p style={{fontSize: '0.85em', color: '#95a5a6', marginTop: '10px'}}>
                        Created: {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
