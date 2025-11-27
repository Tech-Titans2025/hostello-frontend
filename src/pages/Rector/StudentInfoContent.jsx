import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import view from '../../assets/viewButton.png';
import closeIcon from '../../assets/closeIcon.png';
import filterIcon from '../../assets/filterIcon.png';

const StudentInfoContent = () => {
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [search, filterValue, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.listAll();
      const list = Array.isArray(response) ? response : [];
      setStudents(list);
      setFilteredStudents(list);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = Array.isArray(students) ? students : [];

    if (search) {
      filtered = filtered.filter((s) =>
        `${s.firstName} ${s.middleName || ''} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        s.prn.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterValue) {
      filtered = filtered.filter((s) => s.year === filterValue);
    }

    setFilteredStudents(filtered);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatAddressLines = (addr) => {
    if (!addr) return { line1: '-', line2: '' };

    const cleanParts = (value) =>
      (value || '')
        .split(/[;,]+/)
        .map((p) => p.trim())
        .filter(Boolean);

    const line1Parts = [
      ...cleanParts(addr.address),
      addr.city,
      addr.district,
    ].filter(Boolean);

    const baseRegion = [addr.state, addr.country].filter(Boolean).join(', ');
    let line2 = baseRegion;
    if (addr.pinCode) {
      line2 = line2 ? `${line2} - ${addr.pinCode}` : addr.pinCode;
    }

    return {
      line1: line1Parts.length ? line1Parts.join(', ') : '-',
      line2,
    };
  };

  const fetchStudentDetails = async (prn) => {
    try {
      const details = await studentAPI.searchByPRN(prn);
      setSelectedStudent(details);
    } catch (error) {
      console.error('Error fetching student details:', error);
      setError('Failed to fetch student details');
    }
  };

  const handleViewStudent = (prn) => {
    fetchStudentDetails(prn);
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="studentInfoContainer">
      {error && <div className="error-message">{error}</div>}
      
      {/* Summary */}
      <div className="summaryBoxes">
        <div className="summaryBox">
          <div className="label">Total Students</div>
          <div className="value">{students.length}</div>
        </div>
      </div>

      {/* Students List */}
      <div className="studentsList">
        <div className="listHeader">Students</div>

        {/* search filter */}
        <div className="searchBar">
          <input
            type="text"
            placeholder="Search by name..."
            className="searchInput"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="filterDropdown"
          >
            <option value="">All Years</option>
            <option value="FY">FY</option>
            <option value="SY">SY</option>
            <option value="TY">TY</option>
            <option value="BE">BE</option>
          </select>

          <button className="filterButton" onClick={applyFilter}>
            <img src={filterIcon}/> Filter
          </button>
        </div>

        {/* Student Items */}
        {filteredStudents.map((student, i) => (
          <div key={i} className="listItem">
            <div className="listItemContent">
              {student.firstName} {student.middleName || ''} {student.lastName} - {student.prn}
            </div>
            <button
              className="viewButton"
              title="View Details"
              onClick={() => handleViewStudent(student.prn)}
            >
              <img src={view} alt="" />
            </button>
          </div>
        ))}
      </div>

      {selectedStudent && (
        <div className="studentModalOverlay" onClick={() => setSelectedStudent(null)}>
          <div
            className="studentModal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="studentModalContent">
              <button
                className="studentModal-closeButton"
                onClick={() => setSelectedStudent(null)}
              >
                <img src={closeIcon} alt="Close" />
              </button>

              <h3>{selectedStudent.firstName} {selectedStudent.middleName || ''} {selectedStudent.lastName}</h3>
              {/* Basic Info */}
              <div className="studentModalSection">
                <div className="studentModalSection-title">Basic Info</div>
                <div className="studentModalMeta">
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">PRN</span>
                    <span className="studentModalMeta-value">{selectedStudent.prn}</span>
                  </div>
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Gender</span>
                    <span className="studentModalMeta-value">{selectedStudent.gender}</span>
                  </div>
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Date of Birth</span>
                    <span className="studentModalMeta-value">{formatDate(selectedStudent.dob)}</span>
                  </div>
                </div>
              </div>

              {/* Academic / Hostel */}
              <div className="studentModalSection">
                <div className="studentModalSection-title">Academic / Hostel</div>
                <div className="studentModalMeta">
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Branch</span>
                    <span className="studentModalMeta-value">{selectedStudent.branch}</span>
                  </div>
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Year</span>
                    <span className="studentModalMeta-value">{selectedStudent.year}</span>
                  </div>
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Class</span>
                    <span className="studentModalMeta-value">{selectedStudent.className}</span>
                  </div>
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Room</span>
                    <span className="studentModalMeta-value">{selectedStudent.roomNo ? `Room ${selectedStudent.roomNo}` : 'Not Allocated'}</span>
                  </div>
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Date Admitted</span>
                    <span className="studentModalMeta-value">{formatDate(selectedStudent.dateAdmitted)}</span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="studentModalSection">
                <div className="studentModalSection-title">Contact</div>
                <div className="studentModalMeta">
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Student</span>
                    <span className="studentModalMeta-value">{selectedStudent.studentMobNo}</span>
                  </div>
                  <div className="studentModalMeta-row">
                    <span className="studentModalMeta-label">Parent</span>
                    <span className="studentModalMeta-value">{selectedStudent.parentMobNo}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedStudent.address && (
                <div className="studentModalSection">
                  <div className="studentModalSection-title">Address</div>
                  {(() => {
                    const lines = formatAddressLines(selectedStudent.address);
                    return (
                      <div className="studentModalMeta">
                        <div className="studentModalMeta-row">
                          <span className="studentModalMeta-label">Address</span>
                          <span className="studentModalMeta-value">{lines.line1}</span>
                        </div>
                        {lines.line2 && (
                          <div className="studentModalMeta-row">
                            <span className="studentModalMeta-label">State / Pin</span>
                            <span className="studentModalMeta-value">{lines.line2}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentInfoContent;
