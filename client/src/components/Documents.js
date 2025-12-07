import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Documents.css';

const Documents = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Driver License',
    documentNumber: '',
    url: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/users/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDocuments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/users/documents',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Document uploaded successfully! Pending verification.');
      setUploadMode(false);
      setFormData({ type: 'Driver License', documentNumber: '', url: '' });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(error.response?.data?.message || 'Failed to upload document');
    }
  };

  const getStatusBadge = (doc) => {
    if (doc.verified) {
      return <span className="badge badge-success">Verified</span>;
    }
    if (doc.rejectionReason) {
      return <span className="badge badge-danger">Rejected</span>;
    }
    return <span className="badge badge-warning">Pending</span>;
  };

  if (loading) return <div className="loading">Loading documents...</div>;

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1>My Documents</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/profile')} className="btn-secondary">
            Back to Profile
          </button>
          {!uploadMode && (
            <button onClick={() => setUploadMode(true)} className="btn-primary">
              Upload Document
            </button>
          )}
        </div>
      </div>

      {uploadMode && (
        <div className="upload-form-container">
          <form onSubmit={handleSubmit} className="upload-form">
            <h2>Upload New Document</h2>
            <div className="form-group">
              <label>Document Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="Driver License">Driver License</option>
                <option value="ID Proof">ID Proof</option>
                <option value="Passport">Passport</option>
                <option value="Insurance">Insurance</option>
              </select>
            </div>
            <div className="form-group">
              <label>Document Number</label>
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleChange}
                placeholder="e.g., DL123456"
              />
            </div>
            <div className="form-group">
              <label>Document URL</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://storage.example.com/document.pdf"
                required
              />
              <small className="help-text">
                Upload your document to a file storage service and paste the URL here
              </small>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Upload</button>
              <button type="button" onClick={() => setUploadMode(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="documents-grid">
        {documents.length === 0 ? (
          <div className="empty-state">
            <p>No documents uploaded yet.</p>
            <p>Upload your Driver License and ID Proof to get verified.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc._id} className="document-card">
              <div className="document-header">
                <h3>{doc.type}</h3>
                {getStatusBadge(doc)}
              </div>
              <div className="document-details">
                {doc.documentNumber && (
                  <p><strong>Number:</strong> {doc.documentNumber}</p>
                )}
                <p><strong>Uploaded:</strong> {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                {doc.verified && doc.verifiedAt && (
                  <p><strong>Verified:</strong> {new Date(doc.verifiedAt).toLocaleDateString()}</p>
                )}
                {doc.rejectionReason && (
                  <div className="rejection-reason">
                    <strong>Rejection Reason:</strong>
                    <p>{doc.rejectionReason}</p>
                  </div>
                )}
              </div>
              <div className="document-actions">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-view">
                  View Document
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="verification-info">
        <h3>Document Verification Requirements</h3>
        <ul>
          <li>Upload clear, high-quality images or PDFs</li>
          <li>Ensure all text is readable</li>
          <li>Driver License must not be expired</li>
          <li>ID Proof must be government-issued</li>
          <li>Verification typically takes 24-48 hours</li>
        </ul>
      </div>
    </div>
  );
};

export default Documents;
