import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './AdminDashboard.css';
import '../../index.css';

// Import Admin Components
import AdminDashboardContent from './AdminDashboardContent';
import UserManagement from './UserManagement';
import StudentManagement from './StudentManagement';
import NotificationManagement from './NotificationManagement';
import SystemSettings from './SystemSettings';
import Reports from './Reports';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setActiveTab] = useState('dashboard');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="adminDashPage">
      <Navbar />
      <div className="adminDashboard">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Admin Panel</h2>
            <div className="user-info">
              <p>Welcome, {user?.username || user?.userId}</p>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
          <nav className="admin-nav">
            <NavLink 
              to="dashboard" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="users" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('users')}
            >
              User Management
            </NavLink>
            <NavLink 
              to="students" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('students')}
            >
              Student Management
            </NavLink>
            <NavLink 
              to="notifications" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </NavLink>
            <NavLink 
              to="settings" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={() => setActiveTab('settings')}
            >
              System Settings
            </NavLink>
          </nav>
        </div>

        <div className="dashboard-content">
          <Routes>
            <Route path="dashboard" element={<AdminDashboardContent />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default AdminDashboard;