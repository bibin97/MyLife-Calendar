import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Device session rate limiting
const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again after 15 minutes.' }
});

// Stricter rate limiting for OTP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again after 15 minutes.' }
});

// 1. Primary Device-Bound Session Endpoints
router.post('/device-session', sessionLimiter, authController.createOrResumeDeviceSession);
router.post('/logout', authController.logout);
router.post('/reset-session', protect, authController.resetSession);
router.get('/me', protect, authController.getMe);
router.patch('/profile', protect, authController.updateProfile);

// 2. Preserved Legacy OTP Endpoints (Available for future phone verification)
router.post('/request-otp', otpLimiter, authController.requestOtp);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);

export default router;
