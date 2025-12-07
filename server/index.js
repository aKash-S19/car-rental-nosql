const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI + 'car-rental')
  .then(() => console.log('MongoDB connected to car-rental database'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/branches', require('./routes/branches'));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});