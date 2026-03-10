const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/finsight';

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174','http://localhost:5175'],
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: 'FinSight API is running' });
});

// Public auth routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/budgets', authMiddleware, budgetRoutes);
app.use('/api/goals', authMiddleware, goalRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });

