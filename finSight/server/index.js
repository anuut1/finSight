const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const splitRoutes = require('./routes/splitRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const demoRoutes = require('./routes/demoRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');

const helmet = require('helmet');
const { requestLoggingMiddleware, logger } = require('./utils/logger');

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/finsight';
const isProd = process.env.NODE_ENV === 'production';

// Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isProd ? undefined : false,
  })
);

const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://finsight.anushree-tiwari2024.workers.dev',
    'https://fin-sight-indol-ten.vercel.app',
    process.env.CLIENT_URL,
  ].filter(Boolean)
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  if (isProd) {
    // In production, match configured client URL, CloudFront, Vercel, or Cloudflare domains
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
    if (/^https:\/\/[a-z0-9-]+\.cloudfront\.net$/i.test(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+\.workers\.dev$/i.test(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
    return false;
  }

  // Development origins
  if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Request body size limits to prevent Denial of Service
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestLoggingMiddleware);

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
app.use('/api/splits', authMiddleware, splitRoutes);
app.use('/api/recurring', authMiddleware, recurringRoutes);
app.use('/api/receipts', authMiddleware, receiptRoutes);
app.use('/api/demo', authMiddleware, demoRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

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

