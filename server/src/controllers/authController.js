import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { DeviceSession } from '../models/DeviceSession.js';
import { otpService } from '../services/otpService.js';
import { sessionService } from '../services/sessionService.js';
import { requestOtpSchema, verifyOtpSchema, updateProfileSchema } from '../validators/authValidator.js';
import { env } from '../config/env.js';

export const authController = {
  /**
   * Helper to set cookie with standard options
   */
  setCookie(res, name, token, maxAge = 60 * 24 * 60 * 60 * 1000) {
    const isProd = env.NODE_ENV === 'production';
    res.cookie(name, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // 'none' + secure allows cross-site frontend/backend (Vercel + Render)
      maxAge
    });
  },

  /**
   * Helper to clear cookie
   */
  clearCookie(res, name) {
    const isProd = env.NODE_ENV === 'production';
    res.clearCookie(name, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });
  },

  /**
   * POST /api/auth/device-session
   * Continuous entry: Reuses existing valid session if present on device;
   * otherwise creates a new cryptographically isolated session.
   * Phone number is treated strictly as an unverified display label.
   */
  async createOrResumeDeviceSession(req, res, next) {
    try {
      const { phoneNumber, timezone = 'Asia/Kolkata', preferredLanguage = 'en' } = req.body;

      if (!phoneNumber || !/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
        return res.status(400).json({
          error: 'Please enter a valid 10-digit Indian phone number.'
        });
      }

      const existingDeviceToken = req.cookies?.device_session;

      // 1. Requirement 1: Reuse existing valid browser session if available!
      if (existingDeviceToken) {
        const existingSession = await sessionService.validateSessionToken(existingDeviceToken);
        if (existingSession) {
          // Update display phone label if user entered a new display number for this device
          if (phoneNumber && existingSession.displayPhone !== phoneNumber) {
            existingSession.displayPhone = phoneNumber;
            await existingSession.save();
          }

          return res.status(200).json({
            message: 'Resumed existing browser personal calendar session.',
            isResumed: true,
            user: {
              _id: existingSession.sessionId,
              sessionId: existingSession.sessionId,
              phoneNumber: existingSession.displayPhone,
              displayName: `Browser User (${existingSession.displayPhone.slice(-4)})`,
              isDeviceBound: true,
              preferredLanguage: existingSession.preferredLanguage || preferredLanguage,
              timezone: existingSession.timezone || timezone,
              createdAt: existingSession.createdAt
            }
          });
        }
      }

      // 2. Otherwise create a new cryptographically isolated random session
      const { sessionDoc, cookieToken, sessionId } = await sessionService.createSession({
        displayPhone: phoneNumber,
        timezone,
        preferredLanguage
      });

      authController.setCookie(res, 'device_session', cookieToken);

      res.status(201).json({
        message: 'Personal browser calendar session initialized.',
        isResumed: false,
        user: {
          _id: sessionId,
          sessionId: sessionId,
          phoneNumber: sessionDoc.displayPhone,
          displayName: `Browser User (${sessionDoc.displayPhone.slice(-4)})`,
          isDeviceBound: true,
          preferredLanguage: sessionDoc.preferredLanguage,
          timezone: sessionDoc.timezone,
          createdAt: sessionDoc.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Exits calendar view without revoking the device session (can resume later).
   */
  async logout(req, res) {
    // Clear cookies from browser
    authController.clearCookie(res, 'token');
    authController.clearCookie(res, 'device_session');

    res.status(200).json({
      message: 'Logged out. Your calendar data remains safely stored on this device session unless reset.'
    });
  },

  /**
   * POST /api/auth/reset-session
   * Requirement 5: Revokes the session token completely.
   * Warns that this permanently removes access to saved data from this browser.
   */
  async resetSession(req, res, next) {
    try {
      if (req.deviceSession?.sessionId) {
        await sessionService.revokeSession(req.deviceSession.sessionId);
      }

      authController.clearCookie(res, 'token');
      authController.clearCookie(res, 'device_session');

      res.status(200).json({
        message: 'Device session has been permanently revoked. New entry will start a clean calendar.'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   */
  async getMe(req, res) {
    res.status(200).json({
      user: {
        _id: req.user._id,
        sessionId: req.user.sessionId || null,
        phoneNumber: req.user.phoneNumber,
        displayName: req.user.displayName,
        isDeviceBound: !!req.user.isDeviceBound,
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

      const isDevice = req.authType === 'device' || req.user?.isDeviceBound;

      if (isDevice) {
        const session = await DeviceSession.findOne({ sessionId: req.user.sessionId });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        if (parsed.data.preferredLanguage) session.preferredLanguage = parsed.data.preferredLanguage;
        if (parsed.data.timezone) session.timezone = parsed.data.timezone;
        await session.save();

        return res.status(200).json({
          message: 'Profile updated successfully',
          user: {
            _id: session.sessionId,
            sessionId: session.sessionId,
            phoneNumber: session.displayPhone,
            displayName: `Browser User (${session.displayPhone.slice(-4)})`,
            isDeviceBound: true,
            preferredLanguage: session.preferredLanguage,
            timezone: session.timezone,
            createdAt: session.createdAt
          }
        });
      }

      // Standard user flow
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (parsed.data.displayName !== undefined) user.displayName = parsed.data.displayName;
      if (parsed.data.preferredLanguage !== undefined) user.preferredLanguage = parsed.data.preferredLanguage;
      if (parsed.data.timezone !== undefined) user.timezone = parsed.data.timezone;

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
  },

  // --------------------------------------------------------------------------
  // Legacy OTP APIs preserved as requested (not deleted)
  // --------------------------------------------------------------------------
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

  async verifyOtp(req, res, next) {
    try {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { phoneNumber, otp } = parsed.data;
      await otpService.verifyOtp(phoneNumber, otp);

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

      const token = jwt.sign(
        { userId: user._id, phoneNumber: user.phoneNumber },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      authController.setCookie(res, 'token', token, 30 * 24 * 60 * 60 * 1000);

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
  }
};
