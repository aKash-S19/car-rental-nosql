import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './AdminUsers.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || '',
    isActive: searchParams.get('isActive') || '',
    isVerified: searchParams.get('isVerified') || '',
    verificationStatus: searchParams.get('verificationStatus') || '',
    search: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      alert('Access denied. Admin only.');
      navigate('/');
      return;
    }
    fetchUsers();
  }, [filters, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(
        `http://localhost:5000/api/admin/users?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedUser(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to load user details');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    if (!window.confirm(`${currentStatus ? 'Deactivate' : 'Activate'} this user?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User status updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const changeUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'customer' ? 'admin' : 'customer';
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const verifyDocument = async (userId, documentId, verified) => {
    const reason = !verified ? prompt('Enter rejection reason:') : null;
    if (!verified && !reason) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/users/documents/${documentId}/verify`,
        { userId, verified, rejectionReason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Document ${verified ? 'verified' : 'rejected'} successfully`);
      viewUserDetails(userId); // Refresh user details
    } catch (error) {
      console.error('Error verifying document:', error);
      alert(error.response?.data?.message || 'Failed to verify document');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ role: '', isActive: '', isVerified: '', verificationStatus: '', search: '' });
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-users-container">
      <div className="users-header">
        <h1>User Management</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin/stats')} className="btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-panel">
        <div className="filter-group">
          <label>Role:</label>
          <select name="role" value={filters.role} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select name="isActive" value={filters.isActive} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Verified:</label>
          <select name="isVerified" value={filters.isVerified} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Verification Status:</label>
          <select name="verificationStatus" value={filters.verificationStatus} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="Not Verified">Not Verified</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="filter-group search-group">
          <label>Search:</label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Name, email, phone..."
          />
        </div>
        <button onClick={resetFilters} className="btn-reset">Reset</button>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Bookings</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-message">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <span className={`badge badge-${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-verification-${user.verificationStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td>{user.totalBookings || 0}</td>
                  <td>{user.loyaltyPoints || 0}</td>
                  <td className="actions-cell">
                    <button onClick={() => viewUserDetails(user._id)} className="btn-view">
                      View
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                      className={user.isActive ? 'btn-danger' : 'btn-success'}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => changeUserRole(user._id, user.role)}
                      className="btn-role"
                    >
                      Make {user.role === 'customer' ? 'Admin' : 'Customer'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="user-info-section">
                <h3>Account Information</h3>
                <p><strong>Name:</strong> {selectedUser.user.name}</p>
                <p><strong>Email:</strong> {selectedUser.user.email}</p>
                <p><strong>Phone:</strong> {selectedUser.user.phone || 'N/A'}</p>
                <p><strong>Role:</strong> {selectedUser.user.role}</p>
                <p><strong>Status:</strong> {selectedUser.user.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Verification:</strong> {selectedUser.user.verificationStatus}</p>
                <p><strong>Total Bookings:</strong> {selectedUser.user.totalBookings || 0}</p>
                <p><strong>Loyalty Points:</strong> {selectedUser.user.loyaltyPoints || 0}</p>
              </div>

              {selectedUser.user.documents && selectedUser.user.documents.length > 0 && (
                <div className="documents-section">
                  <h3>Documents</h3>
                  {selectedUser.user.documents.map((doc) => (
                    <div key={doc._id} className="document-item">
                      <div className="document-info">
                        <strong>{doc.type}</strong>
                        <span className={`badge ${doc.verified ? 'badge-success' : 'badge-warning'}`}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <p>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      {doc.rejectionReason && (
                        <p className="rejection-reason">Rejected: {doc.rejectionReason}</p>
                      )}
                      <div className="document-actions">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-view-doc">
                          View Document
                        </a>
                        {!doc.verified && (
                          <>
                            <button
                              onClick={() => verifyDocument(selectedUser.user._id, doc._id, true)}
                              className="btn-verify"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => verifyDocument(selectedUser.user._id, doc._id, false)}
                              className="btn-reject"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedUser.bookings && selectedUser.bookings.length > 0 && (
                <div className="bookings-section">
                  <h3>Recent Bookings</h3>
                  {selectedUser.bookings.map((booking) => (
                    <div key={booking._id} className="booking-item">
                      <p><strong>{booking.car.brand} {booking.car.model}</strong></p>
                      <p>Status: {booking.bookingStatus}</p>
                      <p>Start: {new Date(booking.startDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
