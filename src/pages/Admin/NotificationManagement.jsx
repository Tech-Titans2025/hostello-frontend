import React, { useState, useEffect } from 'react';
import { adminAPI, notificationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendNotification, setShowSendNotification] = useState(false);
  const { user } = useAuth();
  const [targetType, setTargetType] = useState('ROLE');
  const initialNotificationState = {
    message: '',
    receiverRole: 'RECTOR',
    receiverId: ''
  };
  const [newNotification, setNewNotification] = useState(initialNotificationState);
  const [filter, setFilter] = useState({
    userId: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [readNotifications, setReadNotifications] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.filterNotifications({});
      setNotifications(Array.isArray(response) ? response : []);
      setReadNotifications([]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!newNotification.message.trim()) {
      setError('Notification message is required');
      return;
    }

    if (targetType === 'USER' && !newNotification.receiverId.trim()) {
      setError('Recipient user ID is required for individual notifications');
      return;
    }

    try {
      setError('');
      setSuccess('');

      const payload = {
        message: newNotification.message.trim(),
      };

      if (user?.userId) {
        payload.senderId = user.userId;
      }

      if (targetType === 'ROLE') {
        if (newNotification.receiverRole !== 'ALL') {
          payload.receiverRole = newNotification.receiverRole;
        }
      } else if (targetType === 'USER') {
        payload.receiverId = newNotification.receiverId.trim();
      }

      const response = await adminAPI.sendNotification(payload);
      setSuccess(response || 'Notification sent successfully!');
      setShowSendNotification(false);
      setTargetType('ROLE');
      setNewNotification(initialNotificationState);
      fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Error sending notification:', error);
      setError(error.message || 'Failed to send notification');
    }
  };

  const handleFilterNotifications = async () => {
    try {
      setError('');
      const payload = {};
      if (filter.userId && filter.userId.trim()) {
        payload.userId = filter.userId.trim();
      }
      if (filter.role) {
        payload.role = filter.role;
      }

      const response = await adminAPI.filterNotifications(payload);
      setNotifications(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error filtering notifications:', error);
      setError('Failed to filter notifications');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setError('');
      const response = await notificationAPI.markRead(notificationId);
      setSuccess(response || 'Notification marked as read');
      setReadNotifications((prev) =>
        prev.includes(notificationId) ? prev : [...prev, notificationId]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
    }
  };

  const handleDeleteNotification = (notificationId) => {
    setError('');
    setSuccess('');
    setNotificationToDelete(notificationId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!notificationToDelete) return;

    try {
      setError('');
      setSuccess('');
      const response = await notificationAPI.delete(notificationToDelete);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationToDelete));
      setReadNotifications((prev) => prev.filter((id) => id !== notificationToDelete));
      setSuccess(response || 'Notification deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError(error.message || 'Failed to delete notification');
    } finally {
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setNotificationToDelete(null);
  };

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="notification-management">
      <h1>Notification Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="notification-actions">
        <div className="send-notification-section">
          <h3>Send Notification</h3>
          <button 
            className="send-notification-btn"
            onClick={() => {
              setError('');
              setSuccess('');
              setShowSendNotification(!showSendNotification);
            }}
          >
            {showSendNotification ? 'Cancel' : 'Send Notification'}
          </button>

          {showSendNotification && (
            <form onSubmit={handleSendNotification} className="send-notification-form">
              <textarea
                placeholder="Notification Message"
                value={newNotification.message}
                onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                rows="4"
                required
              />

              <div className="form-row">
                <label>
                  <input
                    type="radio"
                    name="targetType"
                    value="ROLE"
                    checked={targetType === 'ROLE'}
                    onChange={() => setTargetType('ROLE')}
                  />
                  Send to Role
                </label>
                <label>
                  <input
                    type="radio"
                    name="targetType"
                    value="USER"
                    checked={targetType === 'USER'}
                    onChange={() => setTargetType('USER')}
                  />
                  Send to Specific User
                </label>
              </div>

              {targetType === 'ROLE' ? (
                <select
                  value={newNotification.receiverRole}
                  onChange={(e) => setNewNotification({...newNotification, receiverRole: e.target.value})}
                >
                  <option value="ADMIN">Admins</option>
                  <option value="RECTOR">Rectors</option>
                  <option value="STUDENT">Students</option>
                  <option value="ALL">All Users</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Recipient User ID"
                  value={newNotification.receiverId}
                  onChange={(e) => setNewNotification({...newNotification, receiverId: e.target.value})}
                  required
                />
              )}

              <button type="submit">Send Notification</button>
            </form>
          )}
        </div>

        <div className="filter-section">
          <h3>Filter Notifications</h3>
          <div className="filter-form">
            <input
              type="text"
              placeholder="User ID"
              value={filter.userId}
              onChange={(e) => setFilter({...filter, userId: e.target.value})}
            />
            <select
              value={filter.role}
              onChange={(e) => setFilter({...filter, role: e.target.value})}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="RECTOR">Rector</option>
              <option value="STUDENT">Student</option>
            </select>
            <button onClick={handleFilterNotifications}>Filter</button>
            <button onClick={() => {
              setFilter({userId: '', role: ''});
              fetchNotifications();
            }}>Clear</button>
          </div>
        </div>
      </div>

      <div className="notifications-list">
        <h3>All Notifications ({notifications.length})</h3>
        <div className="notifications-grid">
          {notifications.map((notification, index) => (
            <div
              key={notification.id || index}
              className={`notification-card ${readNotifications.includes(notification.id) ? 'read' : 'unread'}`}
            >
              <div className="notification-header">
                <h4>Notification #{notification.id}</h4>
              </div>
              <p className="notification-message">{notification.message}</p>
              <div className="notification-meta">
                <p><strong>Sender:</strong> {notification.senderId || 'System'}</p>
                <p><strong>Recipient Role:</strong> {notification.receiverRole || '—'}</p>
                <p><strong>Recipient ID:</strong> {notification.receiverId || '—'}</p>
                <p><strong>Sent:</strong> {notification.date ? new Date(notification.date).toLocaleString() : 'N/A'}</p>
              </div>
              <div className="notification-card-actions">
                {!readNotifications.includes(notification.id) && (
                  <button 
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="mark-read-btn"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="delete-notification-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Delete Notification</h3>
            <p>Are you sure you want to delete this notification? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelDelete}>Cancel</button>
              <button className="btn-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;



