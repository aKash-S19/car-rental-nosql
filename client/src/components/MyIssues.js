import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './MyIssues.css';

const MyIssues = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;

  useEffect(() => {
    if (!userId) {
      alert('Please login to view issues');
      navigate('/login');
      return;
    }
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await axios.get('/api/issues', {
        params: { userId, role: userRole }
      });
      setIssues(response.data.issues);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching issues:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'open',
      'In Progress': 'in-progress',
      'Resolved': 'resolved',
      'Closed': 'closed'
    };
    return colors[status] || 'open';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'low',
      'Medium': 'medium',
      'High': 'high',
      'Critical': 'critical'
    };
    return colors[priority] || 'medium';
  };

  if (loading) {
    return <div className="loading">Loading issues...</div>;
  }

  return (
    <div className="my-issues-container">
      <div className="issues-header">
        <div>
          <h1>My Issues</h1>
          <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
            <Link to="/dashboard" style={{color: '#3498db', textDecoration: 'none'}}>← Dashboard</Link>
            <Link to="/" style={{color: '#7f8c8d', textDecoration: 'none'}}>← Home</Link>
          </div>
        </div>
        <button onClick={() => navigate('/report-issue')} className="btn-report">
          + Report New Issue
        </button>
      </div>

      <div className="issues-list">
        {issues.length === 0 ? (
          <div className="no-issues">
            <p>No issues reported yet</p>
            <button onClick={() => navigate('/report-issue')} className="btn-report-first">
              Report Your First Issue
            </button>
          </div>
        ) : (
          issues.map((issue) => (
            <div key={issue._id} className="issue-card">
              <div className="issue-header">
                <div>
                  <h3>{issue.title}</h3>
                  <span className="issue-id">#{issue._id.slice(-8)}</span>
                </div>
                <div className="issue-badges">
                  <span className={`priority-badge ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                  <span className={`status-badge ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                </div>
              </div>

              <div className="issue-meta">
                <span className="issue-type">{issue.issueType}</span>
                <span className="issue-date">
                  {new Date(issue.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="issue-description">{issue.description}</p>

              {issue.car && (
                <div className="related-car">
                  <strong>Related Vehicle:</strong> {issue.car.brand} {issue.car.model} ({issue.car.plateNumber})
                </div>
              )}

              {issue.adminResponse && (
                <div className="admin-response">
                  <strong>Admin Response:</strong>
                  <p>{issue.adminResponse}</p>
                  <small>Responded by {issue.respondedBy?.name} on {new Date(issue.respondedAt).toLocaleDateString()}</small>
                </div>
              )}

              {issue.resolution && (
                <div className="issue-resolution">
                  <strong>Resolution:</strong>
                  <p>{issue.resolution}</p>
                </div>
              )}

              {issue.images && issue.images.length > 0 && (
                <div className="issue-images">
                  {issue.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Issue ${idx + 1}`} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyIssues;
