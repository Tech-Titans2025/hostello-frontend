import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { adminLoginAPI } from '../../services/api';
import './AdminDashboard.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPrn, setSearchPrn] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({
    prn: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dob: '',
    branch: '',
    className: '',
    year: '',
    studentMobNo: '',
    parentMobNo: '',
    dateAdmitted: '',
    address: {
      street: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState({
    branch: '',
    year: '',
    className: ''
  });
  const [editing, setEditing] = useState(null);
  const [creatingLoginFor, setCreatingLoginFor] = useState(null); // student object
  const [loginForm, setLoginForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [hasLoginByPrn, setHasLoginByPrn] = useState({});
  const [deleteConfirmPrn, setDeleteConfirmPrn] = useState(null);
  const [deleteLoginConfirmPrn, setDeleteLoginConfirmPrn] = useState(null);

  const studentToDelete = deleteConfirmPrn
    ? (Array.isArray(students) ? students : []).find((s) => s.prn === deleteConfirmPrn)
    : null;

  const loginDeleteTarget = deleteLoginConfirmPrn
    ? (Array.isArray(students) ? students : []).find((s) => s.prn === deleteLoginConfirmPrn)
    : null;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.listAll();
      const list = Array.isArray(response) ? response : [];
      setStudents(list);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchStudent = async () => {
    if (!searchPrn.trim()) {
      setError('Please enter a PRN');
      return;
    }

    try {
      setError('');
      const response = await studentAPI.searchByPRN(searchPrn);
      setSearchResult(response);
    } catch (error) {
      console.error('Error searching student:', error);
      setError('Student not found');
      setSearchResult(null);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    // Basic validation to ensure required fields are non-empty
    const required = [
      newStudent.prn,
      newStudent.firstName,
      newStudent.lastName,
      newStudent.gender,
      newStudent.dob,
      newStudent.branch,
      newStudent.className,
      newStudent.year,
      newStudent.studentMobNo,
      newStudent.parentMobNo,
      newStudent.dateAdmitted,
      newStudent.address.street,
      newStudent.address.city,
      newStudent.address.district,
      newStudent.address.state,
      newStudent.address.pincode
    ];

    if (required.some((v) => !String(v || '').trim())) {
      setError('Please fill all required fields.');
      return;
    }

    try {
      setError('');
      // Map UI model to backend StudentDTO shape
      const payload = {
        prn: newStudent.prn.trim(),
        firstName: newStudent.firstName.trim(),
        middleName: (newStudent.middleName || '').trim() || null,
        lastName: newStudent.lastName.trim(),
        gender: newStudent.gender,
        dob: newStudent.dob, // yyyy-MM-dd
        branch: newStudent.branch,
        className: newStudent.className,
        year: newStudent.year,
        studentMobNo: newStudent.studentMobNo, // must be +<cc><10digits>
        parentMobNo: newStudent.parentMobNo,
        dateAdmitted: newStudent.dateAdmitted, // yyyy-MM-dd
        address: {
          address: newStudent.address.street,
          city: newStudent.address.city,
          district: newStudent.address.district || '',
          state: newStudent.address.state,
          country: newStudent.address.country || 'India',
          pinCode: newStudent.address.pincode
        }
      };
      await studentAPI.register(payload);
      setSuccess('Student registered successfully!');
      setShowAddStudent(false);
      setNewStudent({
        prn: '',
        firstName: '',
        middleName: '',
        lastName: '',
        gender: 'M',
        dob: '',
        branch: '',
        className: 'A',
        year: 'FY',
        studentMobNo: '',
        parentMobNo: '',
        dateAdmitted: '',
        address: {
          street: '',
          city: '',
          district: '',
          state: '',
          pincode: '',
          country: 'India'
        }
      });
      fetchStudents(); // Refresh the list
    } catch (error) {
      console.error('Error adding student:', error);
      setError(error.message || 'Failed to register student');
    }
  };

  const normalizeFilterValue = (value) => {
    if (typeof value !== 'string') return value ?? null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const handleFilterStudents = async () => {
    try {
      setError('');
      const payload = {
        branch: normalizeFilterValue(filter.branch),
        year: normalizeFilterValue(filter.year),
      };

      if (!payload.branch && !payload.year) {
        await fetchStudents();
        return;
      }

      const response = await studentAPI.filter(payload);
      const list = Array.isArray(response) ? response : [];
      setStudents(list);
    } catch (error) {
      console.error('Error filtering students:', error);
      setError('Failed to filter students');
    }
  };

  const handleDeleteStudent = async (prn) => {
    try {
      setError('');
      setDeleteConfirmPrn(null);
      await studentAPI.delete(prn);
      setSuccess('Student deleted successfully!');
      fetchStudents(); // Refresh the list
    } catch (error) {
      console.error('Error deleting student:', error);
      setError(error.message || 'Failed to delete student');
    }
  };

  const handleDeleteLogin = async (prn) => {
    try {
      setError('');
      const { adminLoginAPI } = await import('../../services/api');
      await adminLoginAPI.deleteUserByPrn(prn);
      setSuccess('User login deleted successfully');
      setHasLoginByPrn((m) => ({ ...m, [prn]: false }));
    } catch (err) {
      console.error('Delete user failed:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleteLoginConfirmPrn(null);
    }
  };

  const startEdit = (student) => {
    setEditing({ ...student });
    setError('');
    setSuccess('');
  };

  const handleCreateLogin = async (student) => {
    try {
      setError('');
      setSuccess('');
      // Prefer PRN as username; check if a user already exists with this PRN
      const existing = await import('../../services/api').then(m => m.adminAPI.searchUser(student.prn)).catch(() => null);
      if (existing && existing.userId) {
        setHasLoginByPrn((m) => ({ ...m, [student.prn]: true }));
        setSuccess('Login already exists for this student.');
        return;
      }
      setCreatingLoginFor(student);
      setLoginForm({ username: student.prn, password: '', confirmPassword: '' });
    } catch (e) {
      // If search fails (404) treat as no login
      setCreatingLoginFor(student);
      setLoginForm({ username: student.prn, password: '', confirmPassword: '' });
    }
  };

  const cancelCreateLogin = () => {
    setCreatingLoginFor(null);
    setLoginForm({ username: '', password: '', confirmPassword: '' });
  };

  const submitCreateLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim()) return setError('Username is required');
    if (!loginForm.password || loginForm.password.length < 6) return setError('Password must be at least 6 characters');
    if (loginForm.password !== loginForm.confirmPassword) return setError('Passwords do not match');

    try {
      setError('');
      const student = creatingLoginFor;
      const payload = {
        prn: student.prn,
        username: loginForm.username.trim(),
        password: loginForm.password,
        confirmPassword: loginForm.confirmPassword
      };
      await adminLoginAPI.createStudentLogin(payload);
      setSuccess(`Login created successfully for ${student.firstName} ${student.lastName}`);
      setHasLoginByPrn((m) => ({ ...m, [student.prn]: true }));
      setCreatingLoginFor(null);
      setLoginForm({ username: '', password: '', confirmPassword: '' });
    } catch (err) {
      console.error('Create login failed:', err);
      setError(err.message || 'Failed to create login');
    }
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await studentAPI.update(editing);
      setSuccess('Student updated successfully!');
      setEditing(null);
      fetchStudents();
    } catch (err) {
      console.error('Error updating student:', err);
      setError(err.message || 'Failed to update student');
    }
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="student-management">
      <h1>Student Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="student-actions">
        <div className="search-section">
          <h3>Search Student</h3>
          <div className="search-form">
            <input
              type="text"
              placeholder="Enter PRN (e.g., 23UCS001)"
              value={searchPrn}
              onChange={(e) => setSearchPrn(e.target.value)}
            />
            <button onClick={handleSearchStudent}>Search</button>
          </div>
          
          {searchResult && (
            <div className="search-result">
              <h4>Search Result:</h4>
              <div className="student-card">
                <p><strong>PRN:</strong> {searchResult.prn}</p>
                <p><strong>Name:</strong> {searchResult.firstName} {searchResult.middleName} {searchResult.lastName}</p>
                <p><strong>Branch:</strong> {searchResult.branch}</p>
                <p><strong>Year:</strong> {searchResult.year}</p>
                <p><strong>Class:</strong> {searchResult.className}</p>
                <p><strong>Mobile:</strong> {searchResult.studentMobNo}</p>
              </div>
            </div>
          )}
        </div>

        <div className="filter-section">
          <h3>Filter Students</h3>
          <div className="filter-form">
            <select
              value={filter.branch}
              onChange={(e) => setFilter({...filter, branch: e.target.value})}
            >
              <option value="">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="CSE-AIML">CSE-AIML</option>
              <option value="CSE-AIDS">CSE-AIDS</option>
              <option value="Electrical">Electrical</option>
              <option value="E&TC">E&TC</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="FT">FT (Fashion Technology)</option>
              <option value="TC">TC (Textile Chemistry)</option>
              <option value="TT">TT (Textile Technology)</option>
            </select>
            <select
              value={filter.year}
              onChange={(e) => setFilter({...filter, year: e.target.value})}
            >
              <option value="">All Years</option>
              <option value="FY">First Year</option>
              <option value="SY">Second Year</option>
              <option value="TY">Third Year</option>
              <option value="BE">Final Year</option>
            </select>
            <button onClick={handleFilterStudents}>Filter</button>
            <button onClick={() => {
              setFilter({branch: '', year: '', className: ''});
              fetchStudents();
            }}>Clear</button>
          </div>
        </div>

        <div className="add-student-section">
          <h3>Add New Student</h3>
          <button 
            className="add-student-btn"
            onClick={() => setShowAddStudent(!showAddStudent)}
          >
            {showAddStudent ? 'Cancel' : 'Add Student'}
          </button>

          {showAddStudent && (
            <form onSubmit={handleAddStudent} className="add-student-form">
              <div className="form-subsection">
                <div className="subsection-header">
                  <span className="subsection-title">Student Basics</span>
                </div>
                <div className="field-grid">
                  <div className="form-field">
                    <label htmlFor="add-prn">PRN (e.g., 23UCS001)</label>
                    <input
                      id="add-prn"
                      type="text"
                      placeholder="Enter PRN (e.g., 23UCS001)"
                      value={newStudent.prn}
                      onChange={(e) => setNewStudent({...newStudent, prn: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-first-name">First Name</label>
                    <input
                      id="add-first-name"
                      type="text"
                      placeholder="Enter first name"
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-middle-name">Middle Name</label>
                    <input
                      id="add-middle-name"
                      type="text"
                      placeholder="Enter middle name"
                      value={newStudent.middleName}
                      onChange={(e) => setNewStudent({...newStudent, middleName: e.target.value})}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-last-name">Last Name</label>
                    <input
                      id="add-last-name"
                      type="text"
                      placeholder="Enter last name"
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-subsection">
                <div className="subsection-header">
                  <span className="subsection-title">Academic Profile</span>
                </div>
                <div className="field-grid">
                  <div className="form-field">
                    <label htmlFor="add-gender">Gender</label>
                    <select
                      id="add-gender"
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({...newStudent, gender: e.target.value})}
                      required
                    >
                      <option value="" disabled hidden>Select Gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-dob">Date of Birth</label>
                    <input
                      id="add-dob"
                      type="date"
                      placeholder="Select birth date"
                      value={newStudent.dob}
                      onChange={(e) => setNewStudent({...newStudent, dob: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-branch">Branch</label>
                    <select
                      id="add-branch"
                      value={newStudent.branch}
                      onChange={(e) => setNewStudent({...newStudent, branch: e.target.value})}
                      required
                    >
                      <option value="" disabled hidden>Select Branch</option>
                      <option value="CSE">CSE</option>
                      <option value="CSE-AIML">CSE-AIML</option>
                      <option value="CSE-AIDS">CSE-AIDS</option>
                      <option value="Electrical">Electrical</option>
                      <option value="E&TC">E&TC</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="FT">FT (Fashion Technology)</option>
                      <option value="TC">TC (Textile Chemistry)</option>
                      <option value="TT">TT (Textile Technology)</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-year">Year</label>
                    <select
                      id="add-year"
                      value={newStudent.year}
                      onChange={(e) => setNewStudent({...newStudent, year: e.target.value})}
                      required
                    >
                      <option value="" disabled hidden>Select Year</option>
                      <option value="FY">First Year</option>
                      <option value="SY">Second Year</option>
                      <option value="TY">Third Year</option>
                      <option value="BE">Final Year</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-class">Class</label>
                    <select
                      id="add-class"
                      value={newStudent.className}
                      onChange={(e) => setNewStudent({...newStudent, className: e.target.value})}
                      required
                    >
                      <option value="" disabled hidden>Select Class</option>
                      <option value="A">Class A</option>
                      <option value="B">Class B</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-date-admitted">Date Admitted</label>
                    <input
                      id="add-date-admitted"
                      type="date"
                      placeholder="Select admission date"
                      value={newStudent.dateAdmitted}
                      onChange={(e) => setNewStudent({...newStudent, dateAdmitted: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-subsection">
                <div className="subsection-header">
                  <span className="subsection-title">Contact Details</span>
                </div>
                <div className="field-grid">
                  <div className="form-field">
                    <label htmlFor="add-student-mobile">Student Mobile (+CountryCode)</label>
                    <input
                      id="add-student-mobile"
                      type="tel"
                      placeholder="e.g., +91xxxxxxxxxx"
                      value={newStudent.studentMobNo}
                      onChange={(e) => setNewStudent({...newStudent, studentMobNo: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-parent-mobile">Parent Mobile (+CountryCode)</label>
                    <input
                      id="add-parent-mobile"
                      type="tel"
                      placeholder="e.g., +91xxxxxxxxxx"
                      value={newStudent.parentMobNo}
                      onChange={(e) => setNewStudent({...newStudent, parentMobNo: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-subsection">
                <div className="subsection-header">
                  <span className="subsection-title">Address</span>
                </div>
                <div className="field-grid address-grid">
                  <div className="form-field">
                    <label htmlFor="add-address-street">Street</label>
                    <input
                      id="add-address-street"
                      type="text"
                      placeholder="Enter street / address line"
                      value={newStudent.address.street}
                      onChange={(e) => setNewStudent({
                        ...newStudent, 
                        address: {...newStudent.address, street: e.target.value}
                      })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-address-city">City</label>
                    <input
                      id="add-address-city"
                      type="text"
                      placeholder="Enter city"
                      value={newStudent.address.city}
                      onChange={(e) => setNewStudent({
                        ...newStudent, 
                        address: {...newStudent.address, city: e.target.value}
                      })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-address-district">District</label>
                    <input
                      id="add-address-district"
                      type="text"
                      placeholder="Enter district"
                      value={newStudent.address.district}
                      onChange={(e) => setNewStudent({
                        ...newStudent,
                        address: {...newStudent.address, district: e.target.value}
                      })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-address-state">State</label>
                    <input
                      id="add-address-state"
                      type="text"
                      placeholder="Enter state"
                      value={newStudent.address.state}
                      onChange={(e) => setNewStudent({
                        ...newStudent, 
                        address: {...newStudent.address, state: e.target.value}
                      })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-address-pincode">Pin Code</label>
                    <input
                      id="add-address-pincode"
                      type="text"
                      placeholder="Enter 6-digit pin code"
                      value={newStudent.address.pincode}
                      onChange={(e) => setNewStudent({
                        ...newStudent, 
                        address: {...newStudent.address, pincode: e.target.value}
                      })}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="add-address-country">Country</label>
                    <input
                      id="add-address-country"
                      type="text"
                      placeholder="Enter country"
                      value={newStudent.address.country}
                      onChange={(e) => setNewStudent({
                        ...newStudent,
                        address: {...newStudent.address, country: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">Register Student</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="students-list">
        <h3>All Students ({Array.isArray(students) ? students.length : 0})</h3>
        <div className="students-grid">
          {(Array.isArray(students) ? students : []).map((student, index) => (
            <div key={index} className="student-card">
              <h4>{student.firstName} {student.middleName} {student.lastName}</h4>
              <p><strong>PRN:</strong> {student.prn}</p>
              <p><strong>Branch:</strong> {student.branch}</p>
              <p><strong>Year:</strong> {student.year}</p>
              <p><strong>Class:</strong> {student.className}</p>
              <p><strong>Mobile:</strong> {student.studentMobNo}</p>
              <div className="student-actions-buttons">
                <button onClick={() => startEdit(student)}>Edit</button>
                <button onClick={() => setDeleteConfirmPrn(student.prn)}>Delete</button>
                {hasLoginByPrn[student.prn] ? (
                  <>
                    <button disabled title="Login already created">Has Login ✅</button>
                    <button onClick={() => setDeleteLoginConfirmPrn(student.prn)}>Delete Login</button>
                  </>
                ) : (
                  <button onClick={() => handleCreateLogin(student)}>Create Login</button>
                )}
              </div>
            </div>
          ))}
          {Array.isArray(students) && students.length === 0 && !error && (
            <div>No students found.</div>
          )}
          {!Array.isArray(students) && (
            <div>Unexpected response received. Please try again.</div>
          )}
        </div>
      </div>

      {editing && (
        <div 
        className="editStudentModalOverlay"
        >
          <div className="editStudentModalContainer">
            <h3 className="editStudentModalTitle">Edit Student</h3>
            <form onSubmit={saveEdit} className="editStudentForm">
              <input type="text" value={editing.prn} disabled className="inputField" />
              <div className="form-row">
                <input type="text" value={editing.firstName} onChange={(e) => setEditing({ ...editing, firstName: e.target.value })} className="inputField" />
                <input type="text" value={editing.middleName || ''} onChange={(e) => setEditing({ ...editing, middleName: e.target.value })} className="inputField"/>
                <input type="text" value={editing.lastName} onChange={(e) => setEditing({ ...editing, lastName: e.target.value })} className="inputField"/>
              </div>
              <div className="form-row">
                <select value={editing.branch} onChange={(e) => setEditing({ ...editing, branch: e.target.value })} className="inputField">
                  <option value="CSE">CSE</option>
                  <option value="CSE-AIML">CSE-AIML</option>
                  <option value="CSE-AIDS">CSE-AIDS</option>
                  <option value="Electrical">Electrical</option>
                  <option value="E&TC">E&TC</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                  <option value="FT">FT (Fashion Technology)</option>
                  <option value="TC">TC (Textile Chemistry)</option>
                  <option value="TT">TT (Textile Technology)</option>
                </select>
                <select value={editing.year} onChange={(e) => setEditing({ ...editing, year: e.target.value })} className="inputField">
                  <option value="FY">First Year</option>
                  <option value="SY">Second Year</option>
                  <option value="TY">Third Year</option>
                  <option value="BE">Final Year</option>
                </select>
                <select value={editing.className} onChange={(e) => setEditing({ ...editing, className: e.target.value })} className="inputField">
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                </select>
              </div>
              <div className="form-row">
                <input type="tel" value={editing.studentMobNo || ''} onChange={(e) => setEditing({ ...editing, studentMobNo: e.target.value })} className="inputField" />
                <input type="tel" value={editing.parentMobNo || ''} onChange={(e) => setEditing({ ...editing, parentMobNo: e.target.value })} className="inputField" />
              </div>
              <h4>Address</h4>
              <div className="form-row">
                <div className="form-field">
                  <input
                    id="edit-address-street"
                    type="text"
                    placeholder="Enter street / address line"
                    value={editing.address?.address || ''}
                    onChange={(e) => setEditing({ ...editing, address: { ...editing.address, address: e.target.value } })}
                    className="inputField"
                  />
                </div>
                <div className="form-field">
                  <input
                    id="edit-address-city"
                    type="text"
                    placeholder="Enter city"
                    value={editing.address?.city || ''}
                    onChange={(e) => setEditing({ ...editing, address: { ...editing.address, city: e.target.value } })}
                    className="inputField"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <input
                    id="edit-address-district"
                    type="text"
                    placeholder="Enter district"
                    value={editing.address?.district || ''}
                    onChange={(e) => setEditing({ ...editing, address: { ...editing.address, district: e.target.value } })}
                    className="inputField"
                  />
                </div>
                <div className="form-field">
                  <input
                    id="edit-address-state"
                    type="text"
                    placeholder="Enter state"
                    value={editing.address?.state || ''}
                    onChange={(e) => setEditing({ ...editing, address: { ...editing.address, state: e.target.value } })}
                    className="inputField"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <input
                    id="edit-address-pincode"
                    type="text"
                    placeholder="Enter 6-digit pin code"
                    value={editing.address?.pinCode || ''}
                    onChange={(e) => setEditing({ ...editing, address: { ...editing.address, pinCode: e.target.value } })}
                    className="inputField"
                  />
                </div>
                <div className="form-field">
                  <input
                    id="edit-address-country"
                    type="text"
                    placeholder="Enter country"
                    value={editing.address?.country || ''}
                    onChange={(e) => setEditing({ ...editing, address: { ...editing.address, country: e.target.value } })}
                    className="inputField"
                  />
                </div>
              </div>
              <div className="buttonsRow">
                <button type="button" onClick={cancelEdit} className="buttonCancel">Cancel</button>
                <button type="submit" className="buttonSubmit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmPrn && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Delete Student</h3>
            <p>
              Are you sure you want to delete student{' '}
              {studentToDelete
                ? `${studentToDelete.firstName} ${studentToDelete.lastName} (${studentToDelete.prn})`
                : deleteConfirmPrn}
              ? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteConfirmPrn(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={() => handleDeleteStudent(deleteConfirmPrn)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteLoginConfirmPrn && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Delete Login</h3>
            <p>
              Are you sure you want to delete login for{' '}
              {loginDeleteTarget
                ? `${loginDeleteTarget.firstName} ${loginDeleteTarget.lastName} (${loginDeleteTarget.prn})`
                : deleteLoginConfirmPrn}
              ? This will remove their account access.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteLoginConfirmPrn(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={() => handleDeleteLogin(deleteLoginConfirmPrn)}
              >
                Delete Login
              </button>
            </div>
          </div>
        </div>
      )}

      {creatingLoginFor && (
        <div 
          className="createLoginModalOverlay"
        >
          <div className="createLoginModalContainer">
            <h3 className="createLoginModalTitle">
              Create Login for {creatingLoginFor.firstName} {creatingLoginFor.lastName}
            </h3>
            <form onSubmit={submitCreateLogin} className="createLoginForm">
              <div className="formRow">
                <h4 className="inputField">Username (default: PRN)</h4>
                <input
                  type="text"
                  placeholder="Username (default: PRN)"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="formRow">
                <h4 className="inputField">Password</h4>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>

              <div className="formRow">
                <h4 className="inputField">Confirm Password</h4>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={loginForm.confirmPassword}
                  onChange={(e) => setLoginForm({ ...loginForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="buttonsRow">
                <button
                  type="button"
                  onClick={cancelCreateLogin}
                  className="buttonCancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="buttonSubmit"
                >
                  Create Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagement;



