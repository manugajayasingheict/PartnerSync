const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware'); // 🛡️ Import the handler

// Load environment variables
dotenv.config();
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));     
app.use('/api/sdg',      require('./routes/sdgRoutes'));      
app.use('/api/projects', require('./routes/projectRoutes')); 
app.use('/api/reports',  require('./routes/reportRoutes'));   
app.use('/api/collab',   require('./routes/collabRoutes'));   

// Root Route
app.get('/', (req, res) => {
  res.send('PartnerSync API is running...');
});

// 🛑 CRITICAL: Error Handler must be after all routes
app.use(errorHandler); 

// Start Server - Only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;