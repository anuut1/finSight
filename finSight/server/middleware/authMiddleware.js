const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Allow public magic email approval links (token is verified in the controller)
  if (
    req.path.startsWith('/drafts/magic-approve') ||
    req.originalUrl?.includes('/api/transactions/drafts/magic-approve')
  ) {
    return next();
  }

  // Allow AWS EventBridge / Lambda trigger with shared secret key
  const reminderSecret = req.headers['x-reminder-secret'];
  if (
    (req.path.startsWith('/drafts/eod-trigger') ||
      req.originalUrl?.includes('/api/transactions/drafts/eod-trigger')) &&
    reminderSecret &&
    process.env.REMINDER_SECRET_KEY &&
    reminderSecret === process.env.REMINDER_SECRET_KEY
  ) {
    req.isCronTrigger = true;
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here');
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { authMiddleware };

