import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { adminLoginAPI } from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [filters, setFilters] = useState({ username: '', role: '' });
  const [editingUser, setEditingUser] = useState(null);
  const initialUserState = {
    username: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT'
  };

  const [newUser, setNewUser] = useState(initialUserState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdUser, setCreatedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listUsers();
      setUsers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!searchUserId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await adminAPI.searchUser(searchUserId);
      setSearchResult(response);
    } catch (error) {
      console.error('Error searching user:', error);
      setError('User not found');
      setSearchResult(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const byUsername = filters.username ? (u.username || '').toLowerCase().includes(filters.username.toLowerCase()) : true;
    const byRole = filters.role ? (u.role || '').toUpperCase() === filters.role : true;
    return byUsername && byRole;
  });

  const startEditUser = (u) => {
    setEditingUser({ ...u });
    setError('');
    setSuccess('');
  };

  const cancelEditUser = () => {
    setEditingUser(null);
  };

  const saveEditUser = async (e) => {
    e.preventDefault();
    // Backend endpoints for updating/deleting users are not available in this codebase
    // Gracefully inform the admin and avoid breaking UI
    try { window?.alert && window.alert('Update user is not available on the server yet.'); } catch (_) {}
  };

  const deleteUser = async (userId) => {
    try {
      const response = await adminLoginAPI.deleteUser(userId);
      alert(response.message || "User deleted successfully!");
      fetchUsers(); // if you reload the table
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };
  

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!newUser.username.trim()) {
      setError('Username is required');
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      setCreatedUser(null);

      const userData = {
        username: newUser.username.trim(),
        mobileNumber: newUser.mobileNumber.trim(),
        password: newUser.password,
        confirmPassword: newUser.confirmPassword,
        role: newUser.role
      };

      const response = await adminAPI.addUser(userData);

      if (response?.error) {
        setError(response.error);
        return;
      }

      const createdUserId = response?.prn || response?.userId || response?.id || response?.data?.userId;
      const createdUsername = response?.username || response?.data?.username || newUser.username.trim();
      const createdRole = response?.role || response?.data?.role || newUser.role;

      setCreatedUser({
        userId: createdUserId,
        username: createdUsername,
        role: createdRole,
        mobileNumber: newUser.mobileNumber.trim()
      });

      setSuccess(
        createdUserId
          ? `User added successfully! User ID: ${createdUserId}`
          : (response?.message || 'User added successfully!')
      );
      try { window?.alert && window.alert('User added successfully!'); } catch (_) {}
      setShowAddUser(false);
      setNewUser(initialUserState);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error adding user:', error);
      setError(error.message || 'Failed to add user');
    }
    finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <h1>User Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {createdUser && (
        <div className="created-user-banner" style={{
          background: '#e7f9ed',
          border: '1px solid #b6f0c8',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div>
              <strong>New user created.</strong>
              <div>
                <span style={{ marginRight: 12 }}><strong>User ID:</strong> {createdUser.userId || 'Generated by server'}</span>
                <span style={{ marginRight: 12 }}><strong>Username:</strong> {createdUser.username}</span>
                <span style={{ marginRight: 12 }}><strong>Role:</strong> {createdUser.role}</span>
              </div>
              <div style={{ fontSize: 12, color: '#2e7d32' }}>
                Use the User ID and the set password to log in on the login page.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  const toCopy = `User ID: ${createdUser.userId || ''}\nUsername: ${createdUser.username}\nRole: ${createdUser.role}`;
                  navigator.clipboard.writeText(toCopy).catch(() => {});
                }}
              >
                Copy Details
              </button>
              {createdUser.userId && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(String(createdUser.userId)).catch(() => {});
                  }}
                >
                  Copy User ID
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="user-actions">
        <div className="filter-section">
          <h3>Filter Users</h3>
          <div className="filter-form">
            <input
              type="text"
              placeholder="Filter by Username"
              value={filters.username}
              onChange={(e) => setFilters({ ...filters, username: e.target.value })}
            />
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="RECTOR">Rector</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button onClick={() => setFilters({ username: '', role: '' })}>Clear</button>
          </div>
        </div>
        <div className="search-section">
          <h3>Search User</h3>
          <div className="search-form">
            <input
              type="text"
              placeholder="Enter User ID"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
            />
            <button onClick={handleSearchUser}>Search</button>
          </div>
          
          {searchResult && (
            <div className="search-result">
              <h4>Search Result:</h4>
              <div className="user-card">
                <p><strong>User ID:</strong> {searchResult.userId}</p>
                <p><strong>Username:</strong> {searchResult.username}</p>
                <p><strong>Role:</strong> {searchResult.role}</p>
                <p><strong>Mobile:</strong> {searchResult.mobileNumber}</p>
              </div>
            </div>
          )}
        </div>

        <div className="add-user-section">
          <h3>Add New User</h3>
          <button 
            className="add-user-btn"
            onClick={() => {
              setError('');
              setSuccess('');
              setShowAddUser(!showAddUser);
            }}
          >
            {showAddUser ? 'Cancel' : 'Add User'}
          </button>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="add-user-form">
              <p className="form-helper">User ID will be generated automatically after registration.</p>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={newUser.mobileNumber}
                onChange={(e) => setNewUser({...newUser, mobileNumber: e.target.value})}
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="RECTOR">Rector</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={newUser.confirmPassword}
                onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                required
              />
              <button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add User'}</button>
            </form>
          )}
        </div>
      </div>

      <div className="users-list">
        <h3>All Users ({users.length})</h3>
        <div className="users-grid">
          {filteredUsers.map((user, index) => (
            <div key={index} className="user-card">
              <h4>{user.username || user.userId}</h4>
              <p><strong>User ID:</strong> {user.userId}</p>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Mobile:</strong> {user.mobileNumber}</p>
              <div className="user-actions-buttons">
                <button onClick={() => startEditUser(user)}>Edit</button>
                <button onClick={() => deleteUser(user.userId)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingUser && (
        <div className="edit-user-modal" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 8, width: 'min(560px, 90vw)' }}>
            <h3>Edit User (not yet enabled server-side)</h3>
            <form onSubmit={saveEditUser} className="edit-user-form" style={{ display: 'grid', gap: 8 }}>
              <input type="text" value={editingUser.userId} disabled />
              <input
                type="text"
                value={editingUser.username || ''}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                placeholder="Username"
              />
              <input
                type="text"
                value={editingUser.mobileNumber || ''}
                onChange={(e) => setEditingUser({ ...editingUser, mobileNumber: e.target.value })}
                placeholder="Mobile Number"
              />
              <select
                value={(editingUser.role || '').toUpperCase()}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              >
                <option value="STUDENT">Student</option>
                <option value="RECTOR">Rector</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={cancelEditUser}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;



