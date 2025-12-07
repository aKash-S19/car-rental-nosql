const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, driverLicense, notificationPreferences } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (driverLicense) {
      user.driverLicense = {
        ...user.driverLicense,
        ...driverLicense,
        verified: false // Reset verification when updated
      };
    }
    if (notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }

    await user.save();

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      action: 'User Updated',
      details: 'User updated their profile',
      resourceType: 'User',
      resourceId: user._id,
      ipAddress: req.ip
    });

    res.json({ 
      message: 'Profile updated successfully', 
      user: await User.findById(user._id).select('-password')
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Upload document
router.post('/documents', authMiddleware, async (req, res) => {
  try {
    const { type, documentNumber, url } = req.body;
    
    if (!type || !url) {
      return res.status(400).json({ message: 'Document type and URL are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add document
    user.documents.push({
      type,
      documentNumber,
      url,
      uploadedAt: new Date()
    });

    // Update verification status if not already verified
    if (user.verificationStatus === 'Not Verified') {
      user.verificationStatus = 'Pending';
    }

    await user.save();

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      action: 'Document Uploaded',
      details: `Document uploaded: ${type}`,
      resourceType: 'Document',
      ipAddress: req.ip
    });

    res.json({ 
      message: 'Document uploaded successfully',
      documents: user.documents
    });
  } catch (err) {
    console.error('Upload document error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all documents
router.get('/documents', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('documents');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.documents);
  } catch (err) {
    console.error('Get documents error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Verify document
router.patch('/documents/:documentId/verify', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId, verified, rejectionReason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const document = user.documents.id(req.params.documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.verified = verified;
    document.verifiedAt = verified ? new Date() : undefined;
    document.verifiedBy = verified ? req.user.userId : undefined;
    if (!verified && rejectionReason) {
      document.rejectionReason = rejectionReason;
    }

    // Check if all required documents are verified
    const requiredDocs = ['Driver License', 'ID Proof'];
    const allVerified = requiredDocs.every(type => 
      user.documents.some(doc => doc.type === type && doc.verified)
    );

    if (allVerified) {
      user.verificationStatus = 'Verified';
      user.isVerified = true;
    } else if (!verified) {
      user.verificationStatus = 'Rejected';
    }

    await user.save();

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      action: 'Document Verified',
      details: `Document ${verified ? 'verified' : 'rejected'} for user ${user.email}`,
      resourceType: 'Document',
      resourceId: document._id,
      ipAddress: req.ip,
      metadata: { userId: user._id, documentType: document.type }
    });

    res.json({ 
      message: `Document ${verified ? 'verified' : 'rejected'} successfully`,
      user: await User.findById(user._id).select('-password')
    });
  } catch (err) {
    console.error('Verify document error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
