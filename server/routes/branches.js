const express = require('express');
const Branch = require('../models/Branch');
const Car = require('../models/Car');
const AuditLog = require('../models/AuditLog');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Middleware to check admin role
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Get all branches
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { isActive, city, state, search } = req.query;
    
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (state) filter['address.state'] = { $regex: state, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const branches = await Branch.find(filter)
      .populate('manager', 'name email phone')
      .populate('vehicles', 'brand model plateNumber availabilityStatus')
      .sort({ name: 1 });

    res.json(branches);
  } catch (err) {
    console.error('Get branches error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get branch by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('manager', 'name email phone')
      .populate('vehicles', 'brand model plateNumber availabilityStatus pricePerDay');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    res.json(branch);
  } catch (err) {
    console.error('Get branch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new branch (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, code, address, contactPhone, contactEmail, manager, operatingHours, capacity } = req.body;

    if (!name || !code || !contactPhone || !contactEmail) {
      return res.status(400).json({ message: 'Name, code, contact phone, and email are required' });
    }

    // Check if code already exists
    const existingBranch = await Branch.findOne({ code: code.toUpperCase() });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch code already exists' });
    }

    const branch = new Branch({
      name,
      code: code.toUpperCase(),
      address,
      contactPhone,
      contactEmail,
      manager,
      operatingHours,
      capacity
    });

    await branch.save();

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      action: 'Vehicle Added',
      details: `Branch created: ${branch.name} (${branch.code})`,
      resourceType: 'System',
      resourceId: branch._id,
      ipAddress: req.ip
    });

    res.status(201).json({ 
      message: 'Branch created successfully',
      branch: await Branch.findById(branch._id).populate('manager', 'name email phone')
    });
  } catch (err) {
    console.error('Create branch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update branch (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, address, contactPhone, contactEmail, manager, operatingHours, capacity, isActive } = req.body;

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Update fields
    if (name) branch.name = name;
    if (address) branch.address = address;
    if (contactPhone) branch.contactPhone = contactPhone;
    if (contactEmail) branch.contactEmail = contactEmail;
    if (manager !== undefined) branch.manager = manager;
    if (operatingHours) branch.operatingHours = operatingHours;
    if (capacity) branch.capacity = capacity;
    if (isActive !== undefined) branch.isActive = isActive;

    await branch.save();

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      action: 'Vehicle Updated',
      details: `Branch updated: ${branch.name} (${branch.code})`,
      resourceType: 'System',
      resourceId: branch._id,
      ipAddress: req.ip
    });

    res.json({ 
      message: 'Branch updated successfully',
      branch: await Branch.findById(branch._id).populate('manager', 'name email phone')
    });
  } catch (err) {
    console.error('Update branch error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete branch (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Check if branch has vehicles
    if (branch.vehicles.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete branch with assigned vehicles. Please reassign vehicles first.' 
      });
    }

    await Branch.findByIdAndDelete(req.params.id);

    // Create audit log
    await AuditLog.create({
      user: req.user.userId,
      action: 'Vehicle Deleted',
      details: `Branch deleted: ${branch.name} (${branch.code})`,
      resourceType: 'System',
      resourceId: branch._id,
      ipAddress: req.ip
    });

    res.json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error('Delete branch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign vehicle to branch (Admin only)
router.post('/:id/vehicles', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ message: 'Vehicle ID is required' });
    }

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const car = await Car.findById(vehicleId);
    if (!car) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check capacity
    if (branch.currentVehicleCount >= branch.capacity) {
      return res.status(400).json({ message: 'Branch has reached maximum capacity' });
    }

    // Check if vehicle already assigned
    if (branch.vehicles.includes(vehicleId)) {
      return res.status(400).json({ message: 'Vehicle already assigned to this branch' });
    }

    branch.vehicles.push(vehicleId);
    branch.currentVehicleCount = branch.vehicles.length;
    await branch.save();

    res.json({ 
      message: 'Vehicle assigned to branch successfully',
      branch: await Branch.findById(branch._id).populate('vehicles', 'brand model plateNumber')
    });
  } catch (err) {
    console.error('Assign vehicle error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Remove vehicle from branch (Admin only)
router.delete('/:id/vehicles/:vehicleId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    branch.vehicles = branch.vehicles.filter(v => v.toString() !== req.params.vehicleId);
    branch.currentVehicleCount = branch.vehicles.length;
    await branch.save();

    res.json({ 
      message: 'Vehicle removed from branch successfully',
      branch: await Branch.findById(branch._id).populate('vehicles', 'brand model plateNumber')
    });
  } catch (err) {
    console.error('Remove vehicle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
