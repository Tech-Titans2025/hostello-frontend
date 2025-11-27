import React, { useState, useEffect, useRef } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import { attendanceAPI } from '../../services/api';

const AttendanceContent = () => {
  const [studentsOut, setStudentsOut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualPrn, setManualPrn] = useState('');
  const [lastScannedPrn, setLastScannedPrn] = useState('');
  const audioContextRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    fetchAttendanceLogs(date);
    if (date) {
      fetchDailySummary();
    }
  }, [date]);

  const playBeep = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0.2;

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const duration = 0.2;
      const now = audioCtx.currentTime;
      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (e) {
      console.error('Beep error:', e);
    }
  };

  const handleScan = (result) => {
    if (result && result.text) {
      const value = result.text.trim();
      console.log('Barcode scanned:', value);
      
      const nowMs = Date.now();
      const lastTime = lastScanTimeRef.current;

      // Throttle repeated scans
      if (lastScannedPrn === value && nowMs - lastTime < 800) {
        return;
      }

      setLastScannedPrn(value);
      lastScanTimeRef.current = nowMs;
      playBeep();
      handleMarkAttendance(value);
    }
  };

  const handleError = (err) => {
    console.error('Barcode scanner error:', err);
    setError('Failed to access camera. Please check permissions.');
  };

  const fetchAttendanceLogs = async (selectedDate) => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAllLogs();

      const logs = Array.isArray(response) ? response : [];

      // Filter records for the selected date (or today by default) using the date field
      const targetDate = selectedDate || date || new Date().toISOString().split('T')[0];
      const dateRecords = logs.filter((log) => {
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

        // For the detailed attendance view we want to see all movements
        // for the selected day: students who are still out (no exitTime yet)
        // and those who have already returned (exitTime filled).
        return logDate === targetDate;
      });

      setStudentsOut(dateRecords.slice(0, 20)); // Show latest 20
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
      setError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await attendanceAPI.getDailySummary(date);
      setSummary(response);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      setSummary(null);
    }
  };

  const handleMarkAttendance = async (prn) => {
    try {
      await attendanceAPI.mark({ prn, status: 'OUT' });
      setError('');
      fetchAttendanceLogs(date);
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError('Failed to mark attendance');
    }
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
    if (Number.isNaN(date.getTime())) {
      // If parsing fails but we still have a string, show it directly
      if (typeof timestamp === 'string') {
        return timestamp;
      }
      return 'N/A';
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <div className="loading">Loading attendance...</div>;
  }

  const currentlyOut = studentsOut.filter((record) => {
    const outTime = record.entryTime || record.outTime;
    const inTime = record.exitTime || record.inTime;
    return outTime && !inTime;
  });

  // Get today's date in YYYY-MM-DD format using local timezone
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isToday = date === todayIso;

  return (
    <div className="attendanceContainer">
      <h2>Attendance Management</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="scanner-section" style={{ marginTop: '16px', marginBottom: '24px' }}>
        <h3>Scan Barcode</h3>
        <p style={{ color: '#bbb', fontSize: '0.9rem' }}>
          Open the webcam and show the student's PRN barcode to mark entry or exit automatically.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            marginTop: '8px',
            marginBottom: '12px'
          }}
        >
          <button 
            onClick={() => setIsScanning(!isScanning)} 
            className={`scan-btn ${isScanning ? 'stop' : ''}`}
          >
            {isScanning ? 'Stop Scanner' : 'Open Webcam Scanner'}
          </button>

          <input
            type="text"
            placeholder="Enter PRN manually"
            value={manualPrn}
            onChange={(e) => setManualPrn(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '5px',
              border: '1px solid #555',
              background: '#222',
              color: '#fff',
              flex: 1
            }}
          />
          <button
            onClick={() => {
              const value = manualPrn.trim();
              if (!value) {
                setError('Please enter a PRN to mark attendance');
                return;
              }
              handleMarkAttendance(value);
            }}
            className="mark-btn"
          >
            Mark
          </button>
        </div>

        {isScanning && (
          <div style={{ marginTop: '8px' }}>
            <BarcodeScanner
              onUpdate={(err, result) => {
                if (result) handleScan(result);
              }}
              onError={handleError}
              facingMode="environment"
              width={320}
              height={240}
              style={{
                borderRadius: '8px',
                border: '1px solid #555',
                background: '#000',
                margin: '0 auto'
              }}
            />
            <p style={{ color: '#bbb', marginTop: '8px', fontSize: '0.85rem' }}>
              Point the student's PRN barcode at the camera.
            </p>
          </div>
        )}
      </div>

      {/* Date Selection */}
      <div className="date-section">
        <label>Select Date: </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #555',
            background: '#222',
            color: '#fff'
          }}
        />
      </div>

      {/* Today's Attendance or Selected Date Attendance */}
      <div className="studentsOut">
        <div className="listHeader">
          {isToday ? "Today's Attendance" : `Attendance for ${date}`} ({studentsOut.length})
        </div>
        {studentsOut.length > 0 ? (
          <div className="attendance-list">
            {studentsOut.map((record, index) => (
              <div key={index} className="attendance-item">
                <div className="student-info">
                  <div className="student-name">{record.studentName || 'Student'}</div>
                  <div className="student-prn">PRN: {record.prn}</div>
                </div>
                <div className="attendance-details">
                  <div className="out-time">
                    <strong>Out Time:</strong> {formatTime(record.entryTime || record.outTime)}
                  </div>
                  <div className="in-time">
                    <strong>In Time:</strong>{' '}
                    {(record.exitTime || record.inTime)
                      ? formatTime(record.exitTime || record.inTime)
                      : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999', padding: '20px' }}>
            No attendance records for today
          </p>
        )}
      </div>

      {/* Students Currently Out (no in time yet) */}
      <div className="studentsOut" style={{ marginTop: '24px' }}>
        <div className="listHeader">
          Students Currently Out ({currentlyOut.length})
        </div>
        {currentlyOut.length > 0 ? (
          <div className="attendance-list">
            {currentlyOut.map((record, index) => (
              <div key={index} className="attendance-item">
                <div className="student-info">
                  <div className="student-name">{record.studentName || 'Student'}</div>
                  <div className="student-prn">PRN: {record.prn}</div>
                </div>
                <div className="attendance-details">
                  <div className="out-time">
                    <strong>Out Time:</strong> {formatTime(record.entryTime || record.outTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999', padding: '20px' }}>
            No students are currently out of the hostel
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="attendance-actions">
        <button onClick={fetchAttendanceLogs} className="refresh-btn">
          Refresh
        </button>
        <button onClick={() => attendanceAPI.triggerScheduledNotification()} className="notify-btn">
          Send Scheduled Notification
        </button>
      </div>
    </div>
  );
};

export default AttendanceContent;
