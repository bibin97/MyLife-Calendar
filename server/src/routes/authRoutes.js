import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Stricter rate limiting specifically for auth/OTP endpoints (brute-force defense)
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OTP requests from this IP. Please try again after 15 minutes.' }
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Max 20 verification attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts from this IP. Please try again after 15 minutes.' }
});

router.post('/request-otp', otpRequestLimiter, authController.requestOtp);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOtp);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/profile', protect, authController.updateProfile);

export default router;
