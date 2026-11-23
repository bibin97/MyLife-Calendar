import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { otpService } from '../services/otpService.js';
import { requestOtpSchema, verifyOtpSchema, updateProfileSchema } from '../validators/authValidator.js';
import { env } from '../config/env.js';

export const authController = {
  /**
   * POST /api/auth/request-otp
   */
  async requestOtp(req, res, next) {
    try {
      const parsed = requestOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const result = await otpService.requestOtp(parsed.data.phoneNumber);
      res.status(200).json({
        message: 'OTP sent successfully to your phone.',
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/verify-otp
   */
  async verifyOtp(req, res, next) {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { phoneNumber, otp } = parsed.data;

      // Verify OTP code
      await otpService.verifyOtp(phoneNumber, otp);

      // Find or automatically create user
      let user = await User.findOne({ phoneNumber });
      let isNewUser = false;

      if (!user) {
        user = await User.create({
          phoneNumber,
          displayName: `User ${phoneNumber.slice(-4)}`,
          preferredLanguage: 'en',
          timezone: 'Asia/Kolkata'
        });
        isNewUser = true;
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, phoneNumber: user.phoneNumber },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      // Set Secure HTTP-only Cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.status(200).json({
        message: isNewUser ? 'Account created and logged in successfully.' : 'Welcome back! Logged in successfully.',
        user: {
          _id: user._id,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
          preferredLanguage: user.preferredLanguage,
          timezone: user.timezone,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.status(200).json({ message: 'Logged out successfully.' });
  },

  /**
   * GET /api/auth/me
   */
  async getMe(req, res) {
    res.status(200).json({
      user: {
        _id: req.user._id,
        phoneNumber: req.user.phoneNumber,
        displayName: req.user.displayName,
        preferredLanguage: req.user.preferredLanguage,
        timezone: req.user.timezone,
        createdAt: req.user.createdAt
      }
    });
  },

  /**
   * PATCH /api/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (parsed.data.displayName !== undefined) {
        user.displayName = parsed.data.displayName;
      }
      if (parsed.data.preferredLanguage !== undefined) {
        user.preferredLanguage = parsed.data.preferredLanguage;
      }
      if (parsed.data.timezone !== undefined) {
        user.timezone = parsed.data.timezone;
      }

      await user.save();

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          _id: user._id,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
          preferredLanguage: user.preferredLanguage,
          timezone: user.timezone,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
