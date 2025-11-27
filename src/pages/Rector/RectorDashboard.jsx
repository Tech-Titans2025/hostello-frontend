import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './RectorDashboard.css';
import '../../index.css';

import DashboardContent from './DashboardContent';
import StudentInfoContent from './StudentInfoContent';
import RoomAllocationContent from './RoomAllocationContent';
import AttendanceContent from './AttendanceContent';
import ComplaintContent from './ComplaintContent';

function RectorDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="rectorDashPage">
      <Navbar />
      <div className="rectorDashboard">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Rector Panel</h2>
            <div className="user-info">
              <p>Welcome, {user?.firstName || user?.userId}</p>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
          <nav className="rector-nav">
            <NavLink to="dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard
            </NavLink>
            <NavLink to="students" className={({ isActive }) => isActive ? 'active' : ''}>
              Student Info
            </NavLink>
            <NavLink to="rooms" className={({ isActive }) => isActive ? 'active' : ''}>
              Room Allocation
            </NavLink>
            <NavLink to="attendance" className={({ isActive }) => isActive ? 'active' : ''}>
              Attendance
            </NavLink>
            <NavLink to="complaint" className={({ isActive }) => isActive ? 'active' : ''}>
              Complaint
            </NavLink>
          </nav>
        </div>

        <div className="dashboard">
          <Routes>
            <Route path="dashboard" element={<DashboardContent />} />
            <Route path="students" element={<StudentInfoContent />} />
            <Route path="rooms" element={<RoomAllocationContent />} />
            <Route path="attendance" element={<AttendanceContent />} />
            <Route path="complaint" element={<ComplaintContent />} />
            <Route path="" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default RectorDashboard;
