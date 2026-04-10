const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');

// Load environment variables
dotenv.config();
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));     // ✅ Member 01
app.use('/api/sdg',      require('./routes/sdgRoutes'));      // ✅ Member 02
app.use('/api/projects', require('./routes/projectRoutes')); // ✅ Member 03
app.use('/api/reports',  require('./routes/reportRoutes'));   // ✅ Member 03
app.use('/api/collab',   require('./routes/collabRoutes'));   // ✅ Member 04 (YOU)

// Root Route
app.get('/', (req, res) => {
  res.send('PartnerSync API is running... OpenAPI docs: /api-docs');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;   // ← Required for supertest in tests