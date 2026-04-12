const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const swaggerSpec = require('./config/swagger');

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
app.use(cors());

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));     
app.use('/api/sdg',      require('./routes/sdgRoutes'));      
app.use('/api/projects', require('./routes/projectRoutes')); 
app.use('/api/reports',  require('./routes/reportRoutes'));   
app.use('/api/collab',   require('./routes/collabRoutes'));   

// Root Route
app.get('/', (req, res) => {
  res.send('PartnerSync API is running... OpenAPI docs: /api-docs');
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