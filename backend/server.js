const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables - Only use .env file if NOT in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Connect to Database
connectDB();

// Initialize Express
const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(express.json());

// Modified CORS for Production
app.use(cors({
  origin: [
    "https://partner-sync.vercel.app", 
    "https://partner-sync-9rrvglou5-manugajayasingheicts-projects.vercel.app",
    "http://localhost:5173", // Keep for local development (Vite default)
    "http://localhost:3000"  // Keep for local development (CRA default)
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

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