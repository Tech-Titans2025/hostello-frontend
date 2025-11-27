import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { rootAdminAPI } from '../../services/api';

const SystemSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    mobileNumber: user?.mobileNumber || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [otpData, setOtpData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [health, setHealth] = useState({ status: 'Checking...', api: 'http://localhost:8085' });

  useEffect(() => {
    setProfileData({
      username: user?.username || '',
      mobileNumber: user?.mobileNumber || ''
    });
    (async () => {
      try {
        const exists = await rootAdminAPI.checkExists();
        setHealth((h) => ({ ...h, status: exists ? 'Active' : 'Active' }));
      } catch (_) {
        setHealth((h) => ({ ...h, status: 'Unavailable' }));
      }
    })();
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      // Note: Profile update API might not be implemented in backend
      setSuccess('Profile update functionality will be implemented soon');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setError('');
      // Note: Password change API might not be implemented in backend
      setSuccess('Password change functionality will be implemented soon');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
    }
  };

  const handleRequestOTP = async () => {
    try {
      setError('');
      await authAPI.requestOTP('ADMIN');
      setShowOtpForm(true);
      setSuccess('OTP sent to your registered mobile number');
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setError('Failed to send OTP');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (otpData.newPassword !== otpData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (otpData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setError('');
      await authAPI.resetPassword(otpData, 'ADMIN');
      setSuccess('Password reset successfully!');
      setShowOtpForm(false);
      setOtpData({
        otp: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password');
    }
  };

  return (
    <div className="system-settings">
      <h1>System Settings</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile Settings
        </button>
        <button 
          className={activeTab === 'password' ? 'active' : ''}
          onClick={() => setActiveTab('password')}
        >
          Password Settings
        </button>
        <button 
          className={activeTab === 'security' ? 'active' : ''}
          onClick={() => setActiveTab('security')}
        >
          Security Settings
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div className="profile-settings">
            <h3>Profile Information</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={user?.userId || ''}
                  disabled
                  className="disabled-input"
                />
              </div>
              
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="text"
                  value={profileData.mobileNumber}
                  onChange={(e) => setProfileData({...profileData, mobileNumber: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="disabled-input"
                />
              </div>
              
              <button type="submit">Update Profile</button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="password-settings">
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
              </div>
              
              <button type="submit">Change Password</button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="security-settings">
            <h3>Security Settings</h3>
            <div className="security-section">
              <h4>System Health</h4>
              <div className="security-info">
                <p><strong>API:</strong> {health.api}</p>
                <p><strong>Status:</strong> {health.status}</p>
                <p><strong>Authenticated as:</strong> {user?.userId} ({user?.role})</p>
              </div>
            </div>
            
            <div className="security-section">
              <h4>Password Reset via OTP</h4>
              <p>Reset your password using OTP sent to your registered mobile number.</p>
              
              {!showOtpForm ? (
                <button onClick={handleRequestOTP} className="request-otp-btn">
                  Request OTP
                </button>
              ) : (
                <form onSubmit={handlePasswordReset}>
                  <div className="form-group">
                    <label>Enter OTP</label>
                    <input
                      type="text"
                      value={otpData.otp}
                      onChange={(e) => setOtpData({...otpData, otp: e.target.value})}
                      placeholder="Enter 6-digit OTP"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={otpData.newPassword}
                      onChange={(e) => setOtpData({...otpData, newPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={otpData.confirmPassword}
                      onChange={(e) => setOtpData({...otpData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit">Reset Password</button>
                    <button 
                      type="button" 
                      onClick={() => setShowOtpForm(false)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="security-section">
              <h4>Login History</h4>
              <p>View your recent login activities and sessions.</p>
              <button className="view-history-btn">
                View Login History
              </button>
            </div>

            <div className="security-section">
              <h4>Account Security</h4>
              <div className="security-info">
                <p><strong>Last Login:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Account Status:</strong> Active</p>
                <p><strong>Role:</strong> {user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;



