import React, { useState, useEffect, useMemo } from 'react';
import { complaintAPI } from '../../services/api';

const statusColors = {
  PENDING: '#ffc107',
  IN_PROGRESS: '#17a2b8',
  RESOLVED: '#28a745',
  REJECTED: '#dc3545'
};

const humanizeStatus = (status = '') =>
  status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date) => {
  if (!date) return 'N/A';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString();
};

const ComplaintContent = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timeout);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(timeout);
  }, [error]);

  const normaliseComplaints = (items = []) =>
    items.map((item) => {
      const student = item.student || {};
      const status = (item.status || 'PENDING').toUpperCase();
      const studentName = [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(' ');
      const searchField = [
        studentName,
        student.prn,
        student.branch,
        student.className,
        student.year,
        item.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return {
        ...item,
        status,
        studentName: studentName || 'Unknown Student',
        studentPrn: student.prn || 'N/A',
        studentBranch: student.branch || '',
        studentClass: student.className || '',
        studentYear: student.year || '',
        studentMobile: student.studentMobNo || '',
        parentMobile: student.parentMobNo || '',
        searchField
      };
    });

  const handleDeleteComplaint = async (complaintId) => {
    try {
      setError('');
      setSuccess('');
      setUpdatingId(complaintId);
      await complaintAPI.delete(complaintId);
      await fetchComplaints(false);
      setSuccess('Complaint deleted successfully.');
    } catch (deleteError) {
      console.error('Error deleting complaint:', deleteError);
      setError(deleteError.message || 'Failed to delete complaint');
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchComplaints = async (withLoader = true) => {
    try {
      if (withLoader) {
        setLoading(true);
      }
      setError('');
      const response = await complaintAPI.getAll();
      const data = Array.isArray(response) ? response : [];
      setComplaints(normaliseComplaints(data));
    } catch (fetchError) {
      console.error('Error fetching complaints:', fetchError);
      setComplaints([]);
      setError(fetchError.message || 'Failed to fetch complaints');
    } finally {
      if (withLoader) {
        setLoading(false);
      }
    }
  };

  const handleUpdateStatus = async (complaintId, status) => {
    try {
      setError('');
      setSuccess('');
      setUpdatingId(complaintId);
      await complaintAPI.updateStatus(complaintId, status);
      await fetchComplaints(false);
      setSuccess(`Complaint marked ${humanizeStatus(status)}.`);
    } catch (updateError) {
      console.error('Error updating complaint status:', updateError);
      setError(updateError.message || 'Failed to update complaint status');
    } finally {
      setUpdatingId(null);
    }
  };

  const complaintStats = useMemo(() => {
    const stats = {
      TOTAL: complaints.length,
      PENDING: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0
    };

    complaints.forEach((complaint) => {
      const status = complaint.status || 'PENDING';
      if (stats[status] !== undefined) {
        stats[status] += 1;
      }
    });

    return stats;
  }, [complaints]);

  const normalisedSearchTerm = searchTerm.trim().toLowerCase();

  const getStatusColor = (status) => statusColors[status] || '#6c757d';

  const renderActionButtons = (complaint) => {
    const { complaintId, status } = complaint;
    const isUpdating = updatingId === complaintId;

    switch (status) {
      case 'PENDING':
        return (
          <>
            <button
              onClick={() => handleUpdateStatus(complaintId, 'IN_PROGRESS')}
              className="btn-in-progress"
              disabled={isUpdating}
            >
              Mark In Progress
            </button>
            <button
              onClick={() => handleUpdateStatus(complaintId, 'RESOLVED')}
              className="btn-resolved"
              disabled={isUpdating}
            >
              Mark Resolved
            </button>
            <button
              onClick={() => handleUpdateStatus(complaintId, 'REJECTED')}
              className="btn-rejected"
              disabled={isUpdating}
            >
              Reject
            </button>
          </>
        );
      case 'IN_PROGRESS':
        return (
          <>
            <button
              onClick={() => handleUpdateStatus(complaintId, 'RESOLVED')}
              className="btn-resolved"
              disabled={isUpdating}
            >
              Mark Resolved
            </button>
            <button
              onClick={() => handleUpdateStatus(complaintId, 'REJECTED')}
              className="btn-rejected"
              disabled={isUpdating}
            >
              Reject
            </button>
          </>
        );
      case 'RESOLVED':
      case 'REJECTED':
        return (
          <button
            onClick={() => handleDeleteComplaint(complaintId)}
            className="btn-rejected"
            disabled={isUpdating}
          >
            Delete
          </button>
        );
      default:
        return null;
    }
  };

  const complaintsToDisplay = useMemo(() => {
    if (!complaints.length) {
      return [];
    }

    if (!normalisedSearchTerm) {
      return complaints;
    }

    return complaints.filter((complaint) => complaint.searchField.includes(normalisedSearchTerm));
  }, [complaints, normalisedSearchTerm]);

  if (loading) {
    return <div className="loading">Loading complaints...</div>;
  }

  return (
    <div className="complaintContainer">
      <div className="complaint-header">
        <div>
          <h2>Complaint Management</h2>
          <p className="complaint-subtitle">Track and resolve student complaints efficiently.</p>
        </div>

        <div className="complaint-stats">
          <div className="complaint-stat-card">
            <span className="label">Total</span>
            <span className="value">{complaintStats.TOTAL}</span>
          </div>
          <div className="complaint-stat-card">
            <span className="label">Pending</span>
            <span className="value">{complaintStats.PENDING}</span>
          </div>
          <div className="complaint-stat-card">
            <span className="label">In Progress</span>
            <span className="value">{complaintStats.IN_PROGRESS}</span>
          </div>
          <div className="complaint-stat-card">
            <span className="label">Resolved</span>
            <span className="value">{complaintStats.RESOLVED}</span>
          </div>
          <div className="complaint-stat-card">
            <span className="label">Rejected</span>
            <span className="value">{complaintStats.REJECTED}</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="complaint-toolbar">
        <div className="complaint-search">
          <input
            type="search"
            placeholder="Search by student, PRN or keyword"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="button" onClick={() => fetchComplaints()} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {complaintsToDisplay.length === 0 ? (
        <p className="no-complaints">No complaints found.</p>
      ) : (
        <div className="complaintList">
          {complaintsToDisplay.map((complaint) => (
            <div key={complaint.complaintId} className="complaintCard">
              <div className="complaintInfo">
                <div className="complaint-card-header">
                  <h4>Complaint #{complaint.complaintId}</h4>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(complaint.status) }}
                  >
                    {humanizeStatus(complaint.status)}
                  </span>
                </div>

                <div className="complaint-meta">
                  <div className="meta-item">
                    <span className="meta-label">Student</span>
                    <span className="meta-value">{complaint.studentName}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">PRN</span>
                    <span className="meta-value">{complaint.studentPrn}</span>
                  </div>
                  {complaint.studentBranch && (
                    <div className="meta-item">
                      <span className="meta-label">Branch</span>
                      <span className="meta-value">{complaint.studentBranch}</span>
                    </div>
                  )}
                  {complaint.studentYear && (
                    <div className="meta-item">
                      <span className="meta-label">Year</span>
                      <span className="meta-value">{complaint.studentYear}</span>
                    </div>
                  )}
                  <div className="meta-item">
                    <span className="meta-label">Submitted</span>
                    <span className="meta-value">{formatDate(complaint.complainDate)}</span>
                  </div>
                  {complaint.studentMobile && (
                    <div className="meta-item">
                      <span className="meta-label">Student Contact</span>
                      <span className="meta-value">{complaint.studentMobile}</span>
                    </div>
                  )}
                  {complaint.parentMobile && (
                    <div className="meta-item">
                      <span className="meta-label">Parent Contact</span>
                      <span className="meta-value">{complaint.parentMobile}</span>
                    </div>
                  )}
                </div>

                <div className="complaint-description">
                  <span className="meta-label">Description</span>
                  <p>{complaint.description}</p>
                </div>
              </div>

              <div className="complaintActions">{renderActionButtons(complaint)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintContent;
