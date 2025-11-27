import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { studentAPI, notificationAPI } from '../../services/api';

const StudentDashboardContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch student info and notifications in parallel
      const [studentResponse, notificationsResponse] = await Promise.allSettled([
        studentAPI.getProfile(user?.userId),
        notificationAPI.viewByRole('STUDENT')
      ]);

      if (studentResponse.status === 'fulfilled') {
        setStudentInfo(studentResponse.value);
      }

      if (notificationsResponse.status === 'fulfilled') {
        const list = Array.isArray(notificationsResponse.value) ? notificationsResponse.value : [];
        setNotifications(list.slice(0, 5)); // Show only recent 5
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="student-dashboard-content">
      <h1>Student Dashboard</h1>
      {error && <div className="error-message">{error}</div>}
      
      <div className="welcome-section">
        <h2>Welcome back, {studentInfo?.firstName || user?.firstName || user?.username || user?.userId}!</h2>
        <p>Here's your overview for today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Current Status</h3>
          <div className="stat-value">Active</div>
        </div>
        
        <div className="stat-card">
          <h3>Room Allocated</h3>
          <div className="stat-value">
            {studentInfo?.roomNo ? studentInfo.roomNo : 'Not Allocated'}
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Branch</h3>
          <div className="stat-value">{studentInfo?.branch || 'N/A'}</div>
        </div>
        
        <div className="stat-card">
          <h3>Year</h3>
          <div className="stat-value">{studentInfo?.year || 'N/A'}</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Recent Notifications</h2>
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={index} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
                  <h4>{notification.title || 'Notification'}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {fmtDate(notification.sentAt || notification.date || notification.createdAt) || '—'}
                  </span>
                </div>
              ))
            ) : (
              <p>No recent notifications</p>
            )}
          </div>
        </div>

        <div className="section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-btn" onClick={() => navigate('/student/profile')}>View Profile</button>
            <button className="action-btn" onClick={() => navigate('/student/complaints')}>Submit Complaint</button>
            <button className="action-btn" onClick={() => navigate('/student/notifications')}>View Notifications</button>
            <button className="action-btn" onClick={() => {
              const email = 'support@hostello.local';
              const subject = encodeURIComponent('Support Request');
              const body = encodeURIComponent(`Hello,\n\nI need help with my account (PRN: ${user?.userId}).\n\nThanks`);
              window.open(`mailto:${email}?subject=${subject}&body=${body}`);
            }}>Contact Support</button>
          </div>
        </div>
      </div>

      {studentInfo && (
        <div className="student-info-section">
          <h2>Your Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>PRN:</label>
              <span>{studentInfo.prn}</span>
            </div>
            <div className="info-item">
              <label>Name:</label>
              <span>{studentInfo.firstName} {studentInfo.middleName} {studentInfo.lastName}</span>
            </div>
            <div className="info-item">
              <label>Branch:</label>
              <span>{studentInfo.branch}</span>
            </div>
            <div className="info-item">
              <label>Year:</label>
              <span>{studentInfo.year}</span>
            </div>
            <div className="info-item">
              <label>Class:</label>
              <span>{studentInfo.className}</span>
            </div>
            <div className="info-item">
              <label>Mobile:</label>
              <span>{studentInfo.studentMobNo}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboardContent;



