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
    role: 'RECTOR' // Optimized default (safe)
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
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const byUsername = filters.username
      ? (u.username || '').toLowerCase().includes(filters.username.toLowerCase())
      : true;
    const byRole = filters.role
      ? (u.role || '').toUpperCase() === filters.role
      : true;
    return byUsername && byRole;
  });

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

      const createdUserId = response?.prn || response?.userId;
      const createdUsername = newUser.username.trim();

      setCreatedUser({
        userId: createdUserId,
        username: createdUsername,
        role: newUser.role,
        mobileNumber: newUser.mobileNumber.trim()
      });

      setSuccess(
        createdUserId
          ? `User added successfully! User ID: ${createdUserId}`
          : (response?.message || 'User added successfully!')
      );

      setShowAddUser(false);
      setNewUser(initialUserState);
      fetchUsers();
    } catch {
      setError('Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await adminLoginAPI.deleteUser(userId);
      alert(response.message || 'User deleted successfully!');
      fetchUsers();
    } catch {
      alert('Failed to delete user.');
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
    } catch {
      setError('User not found');
      setSearchResult(null);
    }
  };

  return (
    <div className="user-management" style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>User Management</h1>

      {/* Alerts */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Add User Banner */}
      {createdUser && (
        <div className="created-user-banner">
          <strong>New user created.</strong>
          <p><strong>User ID:</strong> {createdUser.userId}</p>
          <p><strong>Username:</strong> {createdUser.username}</p>
          <p><strong>Role:</strong> {createdUser.role}</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="user-actions" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        {/* Filters */}
        <div className="filter-section" style={{ flex: 1 }}>
          <h3>Filter Users</h3>
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
        </div>

        {/* Search */}
        <div className="search-section" style={{ flex: 1 }}>
          <h3>Search User</h3>
          <input
            type="text"
            placeholder="Enter User ID"
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
          />
          <button onClick={handleSearchUser}>Search</button>

          {searchResult && (
            <div className="search-result">
              <h4>Search Result:</h4>
              <p><strong>User ID:</strong> {searchResult.userId}</p>
              <p><strong>Username:</strong> {searchResult.username}</p>
              <p><strong>Role:</strong> {searchResult.role}</p>
            </div>
          )}
        </div>

        {/* Add User */}
        <div className="add-user-section" style={{ flex: 1 }}>
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
              <p>User ID will be generated automatically.</p>
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={newUser.mobileNumber}
                onChange={(e) =>
                  setNewUser({ ...newUser, mobileNumber: e.target.value })
                }
                required
              />
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="RECTOR">Rector</option>
                <option value="ADMIN">Admin</option>
              </select>

              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={newUser.confirmPassword}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    confirmPassword: e.target.value,
                  })
                }
              />

              <button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add User'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* User List */}
      <h3>All Users ({users.length})</h3>
      <div className="users-grid">
        {filteredUsers.map((user, index) => (
          <div key={index} className="user-card">
            <h4>{user.username}</h4>
            <p><strong>User ID:</strong> {user.userId}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Mobile:</strong> {user.mobileNumber}</p>

            <button onClick={() => deleteUser(user.userId)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
