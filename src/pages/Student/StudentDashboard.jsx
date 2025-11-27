import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './StudentDashboard.css';
import '../../index.css';

// Import Student Components
import StudentDashboardContent from './StudentDashboardContent';
import StudentProfile from './StudentProfile';
import StudentNotifications from './StudentNotifications';
import StudentComplaints from './StudentComplaints';

function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread notification count
    const fetchUnreadCount = async () => {
      try {
        const notifications = await notificationAPI.viewByRole('STUDENT');
        const unread = notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUnreadCount();
    // Set up interval to check for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="studentDashPage">
      <Navbar />
      <div className="studentDashboard">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Student Panel</h2>
            <div className="user-info">
              <p>Welcome, {user?.username || user?.firstName || user?.userId}</p>
              <p>PRN: {user?.username || user?.userId}</p>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
          <nav className="student-nav">
            <NavLink 
              to="dashboard" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="profile" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              My Profile
            </NavLink>
            <NavLink 
              to="notifications" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="nav-link-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="notification-badge-nav">{unreadCount}</span>
              )}
            </NavLink>
            <NavLink 
              to="complaints" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('complaints')}
            >
              Complaints
            </NavLink>
          </nav>
        </div>

        <div className="dashboard-content">
          <Routes>
            <Route path="dashboard" element={<StudentDashboardContent />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default StudentDashboard;



