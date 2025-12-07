import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const queryParam = filter !== 'all' ? `?isRead=${filter === 'read'}` : '';
      const response = await axios.get(
        `http://localhost:5000/api/notifications${queryParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        'http://localhost:5000/api/notifications/read-all',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/notifications/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getPriorityClass = (priority) => {
    const classes = {
      'High': 'priority-high',
      'Medium': 'priority-medium',
      'Low': 'priority-low'
    };
    return classes[priority] || 'priority-medium';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Booking Confirmation': '📅',
      'Booking Cancelled': '❌',
      'Pickup Reminder': '🚗',
      'Return Reminder': '🔄',
      'Issue Resolved': '✅',
      'Payment Received': '💰',
      'Document Verified': '📄',
      'Loyalty Reward': '🎁',
      'System Alert': '⚠️'
    };
    return icons[type] || '📬';
  };

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/profile')} className="btn-secondary">
            Back to Profile
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn-primary">
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'tab active' : 'tab'}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'unread' ? 'tab active' : 'tab'}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
        <button
          className={filter === 'read' ? 'tab active' : 'tab'}
          onClick={() => setFilter('read')}
        >
          Read
        </button>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications to display</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-card ${!notification.isRead ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
            >
              <div className="notification-icon">
                {getTypeIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="notification-message">{notification.message}</p>
                <div className="notification-meta">
                  <span className={`type-badge ${notification.type.toLowerCase().replace(/\s+/g, '-')}`}>
                    {notification.type}
                  </span>
                  <span className={`priority-badge priority-${notification.priority.toLowerCase()}`}>
                    {notification.priority}
                  </span>
                </div>
                {notification.relatedBooking && (
                  <div className="related-info">
                    Related to booking #{notification.relatedBooking.bookingNumber || notification.relatedBooking}
                  </div>
                )}
              </div>
              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="btn-mark-read"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification._id)}
                  className="btn-delete"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
