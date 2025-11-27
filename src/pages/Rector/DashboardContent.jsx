import React, { useState, useEffect } from 'react';
import { attendanceAPI, complaintAPI, roomAPI, studentAPI } from '../../services/api';
import profile from '../../assets/profile.jpg';
import './RectorDashboard.css';

const DashboardContent = () => {
  const [outingStudents, setOutingStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data in parallel
      const [attendanceRes, complaintsRes, roomsRes, allocationsRes] = await Promise.allSettled([
        attendanceAPI.getAllLogs(),
        complaintAPI.getAll(),
        roomAPI.getAll(),
        roomAPI.viewAllotments()
      ]);

      let roomByPrn = {};
      if (allocationsRes.status === 'fulfilled' && Array.isArray(allocationsRes.value)) {
        const activeAllocations = allocationsRes.value.filter(
          (alloc) => (alloc.status || '').toUpperCase() === 'ACTIVE'
        );
        roomByPrn = activeAllocations.reduce((acc, alloc) => {
          if (alloc.studentPrn && alloc.roomNo !== undefined && alloc.roomNo !== null) {
            acc[alloc.studentPrn] = alloc.roomNo;
          }
          return acc;
        }, {});
      }

      // Process attendance data for students currently out
      if (attendanceRes.status === 'fulfilled' && Array.isArray(attendanceRes.value)) {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = attendanceRes.value
          .filter((log) => {
            const dateSource = log.date;
            if (!dateSource) {
              return false;
            }

            let logDate;

            if (typeof dateSource === 'string') {
              logDate = dateSource.slice(0, 10);
            } else {
              const parsed = new Date(dateSource);
              if (Number.isNaN(parsed.getTime())) {
                return false;
              }
              logDate = parsed.toISOString().split('T')[0];
            }

            const outTime = log.entryTime || log.outTime;
            const inTime = log.exitTime || log.inTime;
            const isCurrentlyOut = outTime && !inTime;

            return logDate === today && isCurrentlyOut;
          })
          .map((log) => ({
            ...log,
            roomNo: log.roomNo || roomByPrn[log.prn] || null
          }));
        setOutingStudents(todayRecords.slice(0, 10));
      }

      // Process complaints - pending only
      if (complaintsRes.status === 'fulfilled' && Array.isArray(complaintsRes.value)) {
        const pendingComplaints = complaintsRes.value.filter(
          (c) => (c.status || '').toUpperCase() === 'PENDING'
        );
        setComplaints(pendingComplaints.slice(0, 5));
      }

      // Process rooms
      if (roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value)) {
        setRooms(roomsRes.value);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRoomColor = (room) => {
    const occupancy = room.currentOccupancy || 0;

    if (occupancy <= 0) return 'full';
    if (occupancy === 1) return 'semi-full';
    if (occupancy === 2) return 'low';
    return 'empty';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';

    let value = timestamp;

    if (typeof value === 'string') {
      // Handle time-only strings like HH:mm, HH:mm:ss, or HH:mm:ss.SSS
      const match = value.match(/^(\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?$/);
      if (match) {
        value = `1970-01-01T${match[1]}`;
      }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc, room) => {
    const roomNumber = room?.roomNo;
    const floor = roomNumber !== undefined && roomNumber !== null
      ? String(roomNumber).charAt(0) || '0'
      : '0';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push({ ...room, count: room.currentOccupancy || 0 });
    return acc;
  }, {});

  return (
    <div className="dashContent">
      {/* Main Section: Left Column (Outlist + Complaints) + Right Column (Room Grid) */}
      <div className="mainSection">
        {/* Left Column */}
        <div className="leftColumn">
          {/* Students Out */}
          <div className="dashOutlist">
            <h3>Students Out of Hostel</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Room No</th>
                  <th>Out Time</th>
                </tr>
              </thead>
              <tbody>
                {outingStudents.length > 0 ? (
                  outingStudents.map((record, index) => (
                    <tr key={index}>
                      <td>{record.studentName || record.prn}</td>
                      <td>{record.roomNo || 'N/A'}</td>
                      <td>{formatTime(record.entryTime || record.outTime)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>
                      No students currently out
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Complaints */}
          <div className="dashComplaint">
            <h3>Pending Complaints ({complaints.length})</h3>
            <ul>
              {complaints.length > 0 ? (
                complaints.map((c) => (
                  <li key={c.complaintId}>{c.description.substring(0, 50)}...</li>
                ))
              ) : (
                <li style={{ color: '#999' }}>No pending complaints</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Room Grid */}
        <div className="dashGrid">
          <h3>Room Occupancy Status</h3>
          <div className="roomGridScrollable">
            {Object.keys(roomsByFloor)
              .sort((a, b) => Number(a) - Number(b))
              .map((floor) => (
              <div key={floor} className="floorSection">
                <h4>Floor {floor}</h4>
                <div className="roomGrid">
                  {roomsByFloor[floor]
                    .slice()
                    .sort((a, b) => (a.roomNo || 0) - (b.roomNo || 0))
                    .map((room) => (
                    <div
                      key={room.roomNo}
                      className={`roomBox ${getRoomColor(room)}`}
                      title={`Room ${room.roomNo} - ${room.count}/${room.capacity || 3} students`}
                    >
                      {room.roomNo}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;

