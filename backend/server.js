const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
const sdgRoutes = require('./routes/sdgRoutes');
app.use('/api/sdg', sdgRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'SDG Target Management API is running',
    version: '1.0.0',
    endpoints: {
      create: 'POST /api/sdg/create',
      getAll: 'GET /api/sdg/all',
      getOne: 'GET /api/sdg/:id',
      update: 'PUT /api/sdg/update/:id',
      delete: 'DELETE /api/sdg/delete/:id',
      syncUN: 'POST /api/sdg/sync-un'
    }
  });
});

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sdg-partnership';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api/sdg`);
});