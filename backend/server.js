const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();
connectDB();

// Initialize Express
const app = express();

// Middleware (Allows JSON data and Cross-Origin requests)
app.use(express.json());
app.use(cors());

// Define Routes (Placeholders for now)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sdg', require('./routes/sdgRoutes'));
app.use('/api/projects', require('./routes/projectRoutes')); // Your Member 03 Route
app.use('/api/reports', require('./routes/reportRoutes'));

// Root Route (To check if server is working)
app.get('/', (req, res) => {
    res.send('PartnerSync API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});