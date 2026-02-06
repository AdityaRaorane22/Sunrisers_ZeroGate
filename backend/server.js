const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const kycRoutes = require('./routes/kyc.routes');
const schemeRoutes = require('./routes/scheme.routes');
const proofRoutes = require('./routes/proof.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/kyc', kycRoutes);
app.use('/api/scheme', schemeRoutes);
app.use('/api/proof', proofRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 MongoDB: ${process.env.MONGODB_URI || 'localhost:27017'}`);
});