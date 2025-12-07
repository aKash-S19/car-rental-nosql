const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const User = require('../models/User');

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    // For now, we'll check if user exists and has admin role
    // In production, you'd verify JWT token here
    const { userId } = req.body;
    if (!userId) {
      return res.status(401).json({ message: 'User ID required' });
    }
    
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

// GET all cars with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      brand,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      seatingCapacity,
      availabilityStatus,
      search,
      branch,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    // Build filter query
    if (brand) {
      // Support multiple brands
      const brands = brand.split(',');
      query.brand = { $in: brands.map(b => new RegExp(b.trim(), 'i')) };
    }
    if (transmission) query.transmission = transmission;
    if (fuelType) {
      // Support multiple fuel types
      const fuelTypes = fuelType.split(',');
      query.fuelType = { $in: fuelTypes };
    }
    if (seatingCapacity) query.seatingCapacity = parseInt(seatingCapacity);
    if (availabilityStatus) {
      const statuses = availabilityStatus.split(',');
      query.availabilityStatus = { $in: statuses };
    }
    if (branch) query.branch = branch;
    
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }

    // Search across multiple fields
    if (search) {
      query.$or = [
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { plateNumber: new RegExp(search, 'i') }
      ];
    }

    // Sorting
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cars = await Car.find(query)
      .populate('branch', 'name code address')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const totalCars = await Car.countDocuments(query);

    res.json({
      success: true,
      cars,
      pagination: {
        total: totalCars,
        page: parseInt(page),
        pages: Math.ceil(totalCars / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cars', error: error.message });
  }
});

// GET single car by ID
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ success: true, car });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching car', error: error.message });
  }
});

// POST create new car (Admin only)
router.post('/', async (req, res) => {
  try {
    const {
      brand,
      model,
      year,
      transmission,
      fuelType,
      seatingCapacity,
      dailyRate,
      mileage,
      availabilityStatus,
      color,
      plateNumber,
      images,
      features,
      description
    } = req.body;

    // Note: Auth middleware should be added to verify admin
    // For now, accepting requests without userId check

    const car = new Car({
      brand,
      model,
      year,
      transmission,
      fuelType,
      seatingCapacity,
      pricePerDay: dailyRate || 0,
      mileage: mileage || 0,
      availabilityStatus: availabilityStatus || 'Available',
      color,
      plateNumber: plateNumber || `AUTO-${Date.now()}`,
      images: images || [],
      features: features || [],
      description
    });

    await car.save();
    res.status(201).json({
      success: true,
      message: 'Car added successfully',
      car
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding car', error: error.message });
  }
});

// PUT update car (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    // Verify admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json({
      success: true,
      message: 'Car updated successfully',
      car
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating car', error: error.message });
  }
});

// DELETE car (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;

    // Verify admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting car', error: error.message });
  }
});

// PATCH update car availability status (Admin only)
router.patch('/:id/status', async (req, res) => {
  try {
    const { userId, availabilityStatus } = req.body;

    // Verify admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { availabilityStatus },
      { new: true }
    );

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json({
      success: true,
      message: 'Car status updated successfully',
      car
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating car status', error: error.message });
  }
});

// GET available cars only
router.get('/available/list', async (req, res) => {
  try {
    const cars = await Car.find({ availabilityStatus: 'Available' }).sort({ pricePerDay: 1 });
    res.json({
      success: true,
      count: cars.length,
      cars
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available cars', error: error.message });
  }
});

module.exports = router;
