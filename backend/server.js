const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));       // ✅ Member 01 (You made this)
app.use('/api/projects', require('./routes/projectRoutes')); // ✅ Member 03 (You made this)

// 👇 COMMENT THESE OUT until teammates create the files!
app.use('/api/sdg', require('./routes/sdgRoutes'));       // ❌ Member 02 (Not ready?)
app.use('/api/reports', require('./routes/reportRoutes')); // ❌ Member 04 (Not ready?)

// Root Route
app.get('/', (req, res) => {
    res.send('PartnerSync API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});