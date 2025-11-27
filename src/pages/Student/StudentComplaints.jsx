import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { complaintAPI } from '../../services/api';

const StudentComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    description: ''
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // Fetch complaints for the current student using STUDENT role
      const response = await complaintAPI.getAll('STUDENT');
      setComplaints(response);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    
    if (!newComplaint.description.trim()) {
      setError('Please provide a description for your complaint');
      return;
    }

    try {
      setError('');
      await complaintAPI.register({ description: newComplaint.description });
      setSuccess('Complaint submitted successfully!');
      setShowComplaintForm(false);
      setNewComplaint({
        description: ''
      });
      fetchComplaints(); // Refresh the list
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setError(error.message || 'Failed to submit complaint');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#ffc107';
      case 'IN_PROGRESS':
        return '#17a2b8';
      case 'RESOLVED':
        return '#28a745';
      case 'REJECTED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };


  if (loading) {
    return <div className="loading">Loading complaints...</div>;
  }

  return (
    <div className="student-complaints">
      <h1>My Complaints</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="complaints-header">
        <div className="complaints-stats">
          <span className="total-count">Total: {complaints.length}</span>
          <span className="pending-count">
            Pending: {complaints.filter(c => c.status === 'PENDING').length}
          </span>
        </div>
        
        <button 
          className="submit-complaint-btn"
          onClick={() => setShowComplaintForm(!showComplaintForm)}
        >
          {showComplaintForm ? 'Cancel' : 'Submit New Complaint'}
        </button>
      </div>

      {showComplaintForm && (
        <div className="complaint-form-section">
          <h2>Submit New Complaint</h2>
          <form onSubmit={handleSubmitComplaint} className="complaint-form">
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newComplaint.description}
                onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                placeholder="Please describe your complaint in detail..."
                rows="5"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Submit Complaint
              </button>
              <button 
                type="button" 
                onClick={() => setShowComplaintForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="complaints-list">
        <h2>Complaint History</h2>
        {complaints.length > 0 ? (
          <div className="complaints-grid">
            {complaints.map((complaint, index) => (
              <div key={index} className="complaint-card">
                <div className="complaint-header">
                  <h3>Complaint #{complaint.complaintId}</h3>
                  <div className="complaint-meta">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(complaint.status) }}
                    >
                      {complaint.status}
                    </span>
                  </div>
                </div>
                
                <div className="complaint-content">
                  <p>{complaint.description}</p>
                </div>
                
                <div className="complaint-footer">
                  <div className="complaint-dates">
                    <span>Submitted: {new Date(complaint.complainDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-complaints">
            <h3>No complaints found</h3>
            <p>You haven't submitted any complaints yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentComplaints;



