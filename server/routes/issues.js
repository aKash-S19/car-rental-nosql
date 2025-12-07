const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const User = require('../models/User');

// GET all issues (Admin gets all, users get their own)
router.get('/', async (req, res) => {
  try {
    const { userId, role } = req.query;

    let query = {};
    if (role !== 'admin') {
      query.reportedBy = userId;
    }

    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email')
      .populate('car', 'brand model plateNumber')
      .populate('booking', 'startDate endDate')
      .populate('respondedBy', 'name')
      .populate('updates.updatedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching issues', error: error.message });
  }
});

// GET single issue by ID
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('car', 'brand model year plateNumber')
      .populate('booking', 'startDate endDate bookingStatus')
      .populate('respondedBy', 'name')
      .populate('updates.updatedBy', 'name');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json({ success: true, issue });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching issue', error: error.message });
  }
});

// POST create new issue
router.post('/create', async (req, res) => {
  try {
    const {
      userId,
      bookingId,
      carId,
      issueType,
      priority,
      title,
      description,
      images
    } = req.body;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const issue = new Issue({
      reportedBy: userId,
      booking: bookingId || null,
      car: carId || null,
      issueType,
      priority: priority || 'Medium',
      title,
      description,
      images: images || [],
      status: 'Open'
    });

    await issue.save();

    await issue.populate('reportedBy', 'name email');
    await issue.populate('car', 'brand model plateNumber');

    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      issue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating issue', error: error.message });
  }
});

// PATCH update issue status (Admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { userId, status } = req.body;

    // Verify admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.status = status;

    if (status === 'Resolved') {
      issue.resolvedAt = new Date();
    }

    await issue.save();

    res.json({
      success: true,
      message: 'Issue status updated',
      issue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating issue status', error: error.message });
  }
});

// PATCH add admin response
router.patch('/:id/respond', async (req, res) => {
  try {
    const { userId, adminResponse, resolution } = req.body;

    // Verify admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.adminResponse = adminResponse;
    issue.respondedBy = userId;
    issue.respondedAt = new Date();

    if (resolution) {
      issue.resolution = resolution;
    }

    if (issue.status === 'Open') {
      issue.status = 'In Progress';
    }

    await issue.save();

    await issue.populate('respondedBy', 'name');

    res.json({
      success: true,
      message: 'Response added successfully',
      issue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding response', error: error.message });
  }
});

// PATCH add update to issue
router.patch('/:id/update', async (req, res) => {
  try {
    const { userId, updateText } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.updates.push({
      updatedBy: userId,
      updateText,
      updatedAt: new Date()
    });

    await issue.save();
    await issue.populate('updates.updatedBy', 'name');

    res.json({
      success: true,
      message: 'Update added successfully',
      issue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding update', error: error.message });
  }
});

// PATCH update issue priority (Admin)
router.patch('/:id/priority', async (req, res) => {
  try {
    const { userId, priority } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.priority = priority;
    await issue.save();

    res.json({
      success: true,
      message: 'Priority updated',
      issue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating priority', error: error.message });
  }
});

// PATCH update cost estimates (Admin)
router.patch('/:id/cost', async (req, res) => {
  try {
    const { userId, estimatedCost, actualCost } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (estimatedCost !== undefined) {
      issue.estimatedCost = estimatedCost;
    }

    if (actualCost !== undefined) {
      issue.actualCost = actualCost;
    }

    await issue.save();

    res.json({
      success: true,
      message: 'Cost information updated',
      issue
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating cost', error: error.message });
  }
});

// DELETE issue (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting issue', error: error.message });
  }
});

// GET issue statistics (Admin)
router.get('/stats/overview', async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const totalIssues = await Issue.countDocuments();
    const openIssues = await Issue.countDocuments({ status: 'Open' });
    const inProgressIssues = await Issue.countDocuments({ status: 'In Progress' });
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const closedIssues = await Issue.countDocuments({ status: 'Closed' });

    const criticalIssues = await Issue.countDocuments({ priority: 'Critical', status: { $in: ['Open', 'In Progress'] } });

    const issuesByType = await Issue.aggregate([
      { $group: { _id: '$issueType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
        closedIssues,
        criticalIssues,
        issuesByType
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;
