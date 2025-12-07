import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ReportIssue.css';

const ReportIssue = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const userId = localStorage.getItem('userId');

  const [formData, setFormData] = useState({
    issueType: 'Service Complaint',
    priority: 'Medium',
    title: '',
    description: '',
    images: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      alert('Please login to report an issue');
      navigate('/login');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const issueData = {
        userId,
        bookingId: bookingId || null,
        issueType: formData.issueType,
        priority: formData.priority,
        title: formData.title,
        description: formData.description,
        images: formData.images ? formData.images.split(',').map(img => img.trim()) : []
      };

      await axios.post('/api/issues/create', issueData);
      alert('Issue reported successfully! Our team will review it shortly.');
      navigate('/my-issues');
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Failed to report issue');
      setLoading(false);
    }
  };

  return (
    <div className="report-issue-container">
      <div className="report-issue-content">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <div>
            <h1>Report an Issue</h1>
            <p className="subtitle">Help us improve by reporting any problems or concerns</p>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <Link to="/dashboard" style={{color: '#3498db', textDecoration: 'none'}}>← Dashboard</Link>
            <Link to="/" style={{color: '#7f8c8d', textDecoration: 'none'}}>← Home</Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="issue-form">
          <div className="form-row">
            <div className="form-group">
              <label>Issue Type *</label>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                required
              >
                <option value="Service Complaint">Service Complaint</option>
                <option value="Vehicle Damage">Vehicle Damage</option>
                <option value="Mechanical Problem">Mechanical Problem</option>
                <option value="Billing Issue">Billing Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="form-group">
            <label>Detailed Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              placeholder="Please provide as much detail as possible..."
              required
            />
          </div>

          <div className="form-group">
            <label>Image URLs (optional, comma-separated)</label>
            <input
              type="text"
              name="images"
              value={formData.images}
              onChange={handleChange}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
            <small>Provide URLs to images that help illustrate the issue</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
