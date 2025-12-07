const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Registration
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role, address, driverLicense, notificationPreferences } = req.body;
  
  // Basic validation
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Name, email, password, and phone are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { 
      name, 
      email, 
      password: hashedPassword,
      phone,
      role: role || 'customer'
    };

    // Add optional fields if provided
    if (address) userData.address = address;
    if (driverLicense) userData.driverLicense = driverLicense;
    if (notificationPreferences) userData.notificationPreferences = notificationPreferences;

    const user = new User(userData);
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: { 
        id: user._id,
        name: user.name, 
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        loyaltyPoints: user.loyaltyPoints
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login (skip validation since we're only updating lastLogin)
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user._id,
        name: user.name, 
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        loyaltyPoints: user.loyaltyPoints,
        totalBookings: user.totalBookings
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;