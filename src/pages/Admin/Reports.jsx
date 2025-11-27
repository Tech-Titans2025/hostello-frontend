import React, { useEffect, useState } from 'react';
import { adminAPI, studentAPI, complaintAPI, attendanceAPI } from '../../services/api';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    totalUsers: 0,
    totalStudents: 0,
    complaintsSummary: null,
    attendanceDaily: null
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const today = new Date();
        const isoDate = today.toISOString().slice(0, 10);
        const sevenAgo = new Date();
        sevenAgo.setDate(today.getDate() - 7);
        const isoFrom = sevenAgo.toISOString().slice(0, 10);

        const [users, students, complaints, attendance] = await Promise.allSettled([
          adminAPI.listUsers(),
          studentAPI.listAll(),
          // complaint summary over last 7 days (rector endpoint; may be unauthorized for admin)
          complaintAPI.getSummary(isoFrom, isoDate),
          // attendance daily summary for today (rector endpoint; may be unauthorized for admin)
          attendanceAPI.getDailySummary(isoDate)
        ]);

        setData({
          totalUsers: users.status === 'fulfilled' && Array.isArray(users.value) ? users.value.length : 0,
          totalStudents: students.status === 'fulfilled' && Array.isArray(students.value) ? students.value.length : 0,
          complaintsSummary: complaints.status === 'fulfilled' ? complaints.value : null,
          attendanceDaily: attendance.status === 'fulfilled' ? attendance.value : null
        });
      } catch (e) {
        console.error('Reports load failed:', e);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="admin-reports">
      <h1>Reports</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{data.totalUsers}</div>
        </div>
        <div className="stat-card">
          <h3>Total Students</h3>
          <div className="stat-number">{data.totalStudents}</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Complaints (Last 7 Days)</h2>
          {data.complaintsSummary ? (
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data.complaintsSummary, null, 2)}</pre>
          ) : (
            <p>No complaints summary available or access denied.</p>
          )}
        </div>
        <div className="section">
          <h2>Attendance (Today)</h2>
          {data.attendanceDaily ? (
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data.attendanceDaily, null, 2)}</pre>
          ) : (
            <p>No attendance summary available or access denied.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;


