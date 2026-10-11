const express = require('express');
const {
  register,
  login,
  me,
  getAvatarPresignedUrl,
  updateAvatar,
  resetPassword,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/me', authMiddleware, me);
router.post('/avatar/presigned-url', authMiddleware, getAvatarPresignedUrl);
router.put('/avatar', authMiddleware, updateAvatar);

module.exports = router;
