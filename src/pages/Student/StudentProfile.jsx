import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentAPI } from '../../services/api';

const StudentProfile = () => {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await studentAPI.getProfile();
        console.log('Profile response:', response);
        console.log(user);
        setStudentInfo(response);
      } catch (err) {
        console.error('Error fetching student profile:', err);
        setError('Failed to fetch profile information');
        setStudentInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);
  if (loading) {
    return <div>Loading profile...</div>;
  }
  
  if (!studentInfo) {
    return (
      <div className="error-message">
        <h2>Profile Not Found</h2>
        <p>Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <div className="student-profile">
      <h1>My Profile</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-sections">
        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="profile-info">
            <div className="info-row">
              <label>PRN:</label>
              <span>{studentInfo.prn}</span>
            </div>
            <div className="info-row">
              <label>First Name:</label>
              <span>{studentInfo.firstName}</span>
            </div>
            <div className="info-row">
              <label>Middle Name:</label>
              <span>{studentInfo.middleName || 'N/A'}</span>
            </div>
            <div className="info-row">
              <label>Last Name:</label>
              <span>{studentInfo.lastName}</span>
            </div>
            <div className="info-row">
              <label>Gender:</label>
              <span>{studentInfo.gender}</span>
            </div>
            <div className="info-row">
              <label>Date of Birth:</label>
              <span>{studentInfo.dob ? new Date(studentInfo.dob).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Academic Information</h2>
          <div className="profile-info">
            <div className="info-row">
              <label>Branch:</label>
              <span>{studentInfo.branch}</span>
            </div>
            <div className="info-row">
              <label>Year:</label>
              <span>{studentInfo.year}</span>
            </div>
            <div className="info-row">
              <label>Class:</label>
              <span>{studentInfo.className}</span>
            </div>
            <div className="info-row">
              <label>Date Admitted:</label>
              <span>{studentInfo.dateAdmitted ? new Date(studentInfo.dateAdmitted).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Contact Information</h2>
          <div className="profile-info">
            <div className="info-row">
              <label>Student Mobile:</label>
              <span>{studentInfo.studentMobNo}</span>
            </div>
            <div className="info-row">
              <label>Parent Mobile:</label>
              <span>{studentInfo.parentMobNo}</span>
            </div>
          </div>
        </div>

        {studentInfo.address && (
          <div className="profile-section">
            <h2>Address Information</h2>
            <div className="profile-info">
              <div className="info-row">
                <label>Address:</label>
                <span>{studentInfo.address.address}</span>
              </div>
              <div className="info-row">
                <label>City:</label>
                <span>{studentInfo.address.city}</span>
              </div>
              <div className="info-row">
                <label>District:</label>
                <span>{studentInfo.address.district}</span>
              </div>
              <div className="info-row">
                <label>State:</label>
                <span>{studentInfo.address.state}</span>
              </div>
              <div className="info-row">
                <label>Pincode:</label>
                <span>{studentInfo.address.pinCode}</span>
              </div>
              <div className="info-row">
                <label>Country:</label>
                <span>{studentInfo.address.country}</span>
              </div>
            </div>
          </div>
        )}

        <div className="profile-section">
          <h2>Room Information</h2>
          <div className="profile-info">
            <div className="info-row">
              <label>Room Number:</label>
              <span>{studentInfo.roomNo ? `Room ${studentInfo.roomNo}` : 'Not Allocated'}</span>
            </div>
            <div className="info-row">
              <label>Building:</label>
              <span>{studentInfo.building || 'N/A'}</span>
            </div>
            <div className="info-row">
              <label>Floor:</label>
              <span>{studentInfo.floor || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="action-btn primary">
          Update Profile
        </button>
        <button className="action-btn secondary">
          Download Profile
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;
