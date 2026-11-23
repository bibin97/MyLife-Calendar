import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { sessionService } from '../services/sessionService.js';
import { env } from '../config/env.js';
import { getAuthCookieOptions } from '../utils/cookieOptions.js';

/**
 * Unified auth protection:
 * Supports both:
 *  1. Registered User JWT (token cookie)
 *  2. Device-Bound Browser Session (device_session cookie)
 */
export const protect = async (req, res, next) => {
  try {
    const userToken = req.cookies?.token;
    const deviceToken = req.cookies?.device_session;

    // 1. Try standard user JWT
    if (userToken) {
      try {
        const decoded = jwt.verify(userToken, env.JWT_SECRET);
        if (decoded.userId) {
          const user = await User.findById(decoded.userId).select('-__v');
          if (user) {
            req.user = user;
            req.authType = 'user';
            req.ownerQuery = { userId: user._id };
            return next();
          }
        }
      } catch {
        res.clearCookie('token', getAuthCookieOptions());
      }
    }

    // 2. Try device-bound session token
    if (deviceToken) {
      const session = await sessionService.validateSessionToken(deviceToken);
      if (session) {
        req.deviceSession = session;
        req.authType = 'device';
        req.ownerQuery = { sessionId: session.sessionId };
        // Create a compatible req.user object so existing controllers and views don't break
        req.user = {
          _id: session.sessionId,
          sessionId: session.sessionId,
          phoneNumber: session.displayPhone,
          displayName: session.displayPhone ? `Browser User (${session.displayPhone.slice(-4)})` : 'Browser User',
          isDeviceBound: true,
          preferredLanguage: session.preferredLanguage || 'en',
          timezone: session.timezone || 'Asia/Kolkata',
          createdAt: session.createdAt
        };
        return next();
      } else {
        res.clearCookie('device_session', getAuthCookieOptions());
      }
    }

    return res.status(401).json({
      error: 'Not authenticated. Please enter your phone number to access your personal calendar.'
    });
  } catch (error) {
    next(error);
  }
};
