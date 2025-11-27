import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, studentAPI, notificationAPI, rootAdminAPI } from '../../services/api';

const AdminDashboardContent = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalNotifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState('Checking...');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersResponse, studentsResponse, notificationsResponse, healthResponse] = await Promise.allSettled([
        adminAPI.listUsers(),
        studentAPI.listAll(),
        adminAPI.filterNotifications({}),
        // Health-like check: root admin existence endpoint
        rootAdminAPI.checkExists()
      ]);

      const totalUsers = usersResponse.status === 'fulfilled' ? usersResponse.value.length : 0;
      const totalStudents = studentsResponse.status === 'fulfilled' ? studentsResponse.value.length : 0;
      const totalNotifications = notificationsResponse.status === 'fulfilled' && Array.isArray(notificationsResponse.value)
        ? notificationsResponse.value.length
        : 0;
      const isHealthy = healthResponse.status === 'fulfilled';

      setStats({
        totalUsers,
        totalStudents,
        totalNotifications
      });
      setSystemStatus(isHealthy ? 'Active' : 'Unavailable');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      try { window?.alert && window.alert('Failed to load dashboard data'); } catch (_) {}
      setSystemStatus('Unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    navigate('/admin/users');
  };

  const handleRegisterStudent = () => {
    navigate('/admin/students');
  };

  const handleSendNotification = () => {
    navigate('/admin/notifications');
  };

  const handleViewReports = () => {
    navigate('/admin/reports');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-content">
      <h1>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{stats.totalUsers}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Students</h3>
          <div className="stat-number">{stats.totalStudents}</div>
        </div>
        
        <div className="stat-card">
          <h3>Notifications</h3>
          <div className="stat-number">{stats.totalNotifications}</div>
        </div>
        
        <div className="stat-card">
          <h3>System Status</h3>
          <div className="stat-status">{systemStatus}</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-btn" onClick={handleAddUser}>Add New User</button>
            <button className="action-btn" onClick={handleRegisterStudent}>Register Student</button>
            <button className="action-btn" onClick={handleSendNotification}>Send Notification</button>
            <button className="action-btn" onClick={handleViewReports}>View Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardContent;



