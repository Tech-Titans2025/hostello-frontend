import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../services/api';
import { Bell, Search, Calendar, Trash2, CheckCircle, Circle, AlertCircle, Info, X } from 'lucide-react';

const StudentNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [readNotifications, setReadNotifications] = useState([]); // Store read status locally
  const audioRef = useRef(null);
  const pollingInterval = useRef(null);
  
  // Load read notifications from localStorage on component mount
  useEffect(() => {
    const storedReadNotifications = localStorage.getItem(`readNotifications_${user?.userId}`);
    if (storedReadNotifications) {
      setReadNotifications(JSON.parse(storedReadNotifications));
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for real-time updates every 30 seconds
    pollingInterval.current = setInterval(() => {
      fetchNotifications(true); // silent fetch
    }, 30000);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);
  
  // Re-fetch when readNotifications changes to update the isRead status
  useEffect(() => {
    if (notifications.length > 0) {
      setNotifications(prev => prev.map(n => ({
        ...n,
        isRead: readNotifications.includes(n.notificationId)
      })));
    }
  }, [readNotifications]);

  const fetchNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await notificationAPI.viewByRole('STUDENT');
      
      // Map the response to match frontend expectations and add local read status
      const mappedNotifications = response.map(n => ({
        ...n,
        notificationId: n.id || n.notificationId,
        sentAt: n.date || n.sentAt,
        isRead: readNotifications.includes(n.id || n.notificationId), // Use local read status
        title: n.title || 'Notification',
        priority: n.priority || 'NORMAL'
      }));
      
      // Check for new notifications
      if (notifications.length > 0 && mappedNotifications.length > notifications.length) {
        const newNotificationCount = mappedNotifications.length - notifications.length;
        if (newNotificationCount > 0) {
          playNotificationSound();
          setSuccess(`${newNotificationCount} new notification${newNotificationCount > 1 ? 's' : ''} received!`);
          setTimeout(() => setSuccess(''), 5000);
        }
      }
      
      setNotifications(mappedNotifications);
      if (!silent) setError('');
    } catch (error) {
      if (!silent) {
        console.error('Error fetching notifications:', error);
        setError('Failed to fetch notifications');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };
  
  const playNotificationSound = () => {
    // Play a notification sound (you can add an actual audio file later)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBQ');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Could not play sound'));
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setError('');
      
      // Update local read status
      const updatedReadNotifications = [...readNotifications, notificationId];
      setReadNotifications(updatedReadNotifications);
      
      // Save to localStorage
      localStorage.setItem(`readNotifications_${user?.userId}`, JSON.stringify(updatedReadNotifications));
      
      // Update the notifications state
      setNotifications(prev => prev.map(n => 
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      ));
      
      // Still call the API to acknowledge (optional)
      await notificationAPI.markRead(notificationId);
      
      setSuccess('Notification marked as read');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Even if API fails, keep the local change
      setSuccess('Notification marked as read locally');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setError('');
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      // Update local read status for all unread notifications
      const allNotificationIds = notifications.map(n => n.notificationId);
      const updatedReadNotifications = [...new Set([...readNotifications, ...allNotificationIds])];
      setReadNotifications(updatedReadNotifications);
      
      // Save to localStorage
      localStorage.setItem(`readNotifications_${user?.userId}`, JSON.stringify(updatedReadNotifications));
      
      // Update the notifications state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      // Optionally call API for each notification
      Promise.all(
        unreadNotifications.map(notification => 
          notificationAPI.markRead(notification.notificationId).catch(() => {})
        )
      );
      
      setSuccess('All notifications marked as read');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setSuccess('All notifications marked as read locally');
    }
  };
  
  const handleDeleteNotification = async (notificationId) => {
    setNotificationToDelete(notificationId);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    try {
      setError('');
      // Call the actual delete API
      await notificationAPI.delete(notificationToDelete);
      
      // Remove from local state after successful deletion
      setNotifications(prev => prev.filter(n => n.notificationId !== notificationToDelete));
      
      // Also remove from read notifications if it was marked as read
      const updatedReadNotifications = readNotifications.filter(id => id !== notificationToDelete);
      setReadNotifications(updatedReadNotifications);
      localStorage.setItem(`readNotifications_${user?.userId}`, JSON.stringify(updatedReadNotifications));
      
      setSuccess('Notification deleted successfully');
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification: ' + (error.message || 'Unknown error'));
      setShowDeleteConfirm(false);
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      setError('');
      // Call the actual bulk delete API
      await notificationAPI.deleteMultiple(selectedNotifications);
      
      // Remove from local state after successful deletion
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.notificationId)));
      
      // Also remove from read notifications
      const updatedReadNotifications = readNotifications.filter(id => !selectedNotifications.includes(id));
      setReadNotifications(updatedReadNotifications);
      localStorage.setItem(`readNotifications_${user?.userId}`, JSON.stringify(updatedReadNotifications));
      
      setSuccess(`${selectedNotifications.length} notification(s) deleted`);
      setSelectedNotifications([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      setError('Failed to delete notifications: ' + (error.message || 'Unknown error'));
    }
  };
  
  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };
  
  const selectAllNotifications = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.notificationId));
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'read' && !notification.isRead) return false;
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesTitle = notification.title?.toLowerCase().includes(search);
      const matchesMessage = notification.message?.toLowerCase().includes(search);
      if (!matchesTitle && !matchesMessage) return false;
    }
    
    // Filter by date
    if (dateFilter) {
      const notificationDate = new Date(notification.sentAt).toDateString();
      const filterDate = new Date(dateFilter).toDateString();
      if (notificationDate !== filterDate) return false;
    }
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, dateFilter]);
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of notifications
      document.querySelector('.notifications-list')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return <AlertCircle className="priority-icon high" size={16} />;
      case 'normal':
      case 'medium':
        return <Info className="priority-icon normal" size={16} />;
      default:
        return <Info className="priority-icon low" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="student-notifications">
      <div className="notifications-top-header">
        <h1><Bell className="header-icon" size={28} /> My Notifications</h1>
        <div className="notification-badge">
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <X className="close-icon" onClick={() => setError('')} />
          {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          <CheckCircle size={16} />
          {success}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this notification?</p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={confirmDelete}>Delete</button>
              <button className="btn-cancel" onClick={() => {
                setShowDeleteConfirm(false);
                setNotificationToDelete(null);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="date-filter">
          <Calendar size={20} className="calendar-icon" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter by date"
          />
          {dateFilter && (
            <X 
              size={16} 
              className="clear-date" 
              onClick={() => setDateFilter('')}
            />
          )}
        </div>
      </div>

      <div className="notifications-header">
        <div className="notifications-stats">
          <span className="total-count">
            <Circle size={14} />
            Total: {notifications.length}
          </span>
          <span className="unread-count">
            <Bell size={14} />
            Unread: {unreadCount}
          </span>
          {selectedNotifications.length > 0 && (
            <span className="selected-count">
              <CheckCircle size={14} />
              Selected: {selectedNotifications.length}
            </span>
          )}
        </div>
        
        <div className="notifications-controls">
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'unread' ? 'active' : ''}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
            <button 
              className={filter === 'read' ? 'active' : ''}
              onClick={() => setFilter('read')}
            >
              Read
            </button>
          </div>
          
          <div className="action-buttons">
            {filteredNotifications.length > 0 && (
              <button 
                className="select-all-btn"
                onClick={selectAllNotifications}
              >
                {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
            
            {selectedNotifications.length > 0 && (
              <button 
                className="bulk-delete-btn"
                onClick={handleBulkDelete}
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            )}
            
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                <CheckCircle size={14} /> Mark All as Read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="notifications-list">
        {paginatedNotifications.length > 0 ? (
          paginatedNotifications.map((notification, index) => (
            <div 
              key={notification.notificationId || index} 
              className={`notification-card ${notification.isRead ? 'read' : 'unread'} ${
                selectedNotifications.includes(notification.notificationId) ? 'selected' : ''
              }`}
            >
              <div className="notification-select">
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification.notificationId)}
                  onChange={() => toggleSelectNotification(notification.notificationId)}
                  className="notification-checkbox"
                />
              </div>
              
              <div className="notification-main">
                <div className="notification-header">
                  <div className="notification-title-section">
                    {!notification.isRead && <Circle className="unread-indicator" size={8} />}
                    <h3>{notification.title}</h3>
                  </div>
                  <div className="notification-meta">
                    <span className={`priority ${notification.priority?.toLowerCase() || 'normal'}`}>
                      {getPriorityIcon(notification.priority)}
                      {notification.priority || 'NORMAL'}
                    </span>
                    <span className="timestamp">
                      {new Date(notification.sentAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="notification-content">
                  <p>{notification.message}</p>
                </div>
                
                <div className="notification-footer">
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.notificationId)}
                        className="mark-read-btn"
                        title="Mark as read"
                      >
                        <CheckCircle size={16} /> Mark as Read
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteNotification(notification.notificationId)}
                      className="delete-btn"
                      title="Delete notification"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                  <span className={`status ${notification.isRead ? 'read' : 'unread'}`}>
                    {notification.isRead ? 
                      <><CheckCircle size={12} /> Read</> : 
                      <><Circle size={12} /> Unread</>
                    }
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <Bell size={64} className="no-notifications-icon" />
            <h3>No notifications found</h3>
            <p>
              {searchTerm || dateFilter ? 
                "No notifications match your filters. Try adjusting your search criteria." :
                filter === 'all' 
                  ? "You don't have any notifications yet." 
                  : `No ${filter} notifications found.`
              }
            </p>
            {(searchTerm || dateFilter) && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setFilter('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Pagination Controls */}
      {filteredNotifications.length > itemsPerPage && (
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {startIndex + 1} - {Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length} notifications
          </div>
          
          <div className="pagination-buttons">
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="page-numbers">
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                
                return (
                  <button
                    key={index}
                    className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
          
          <select 
            className="items-per-page"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;



