import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { DeviceSession } from '../models/DeviceSession.js';
import { env } from '../config/env.js';

const SESSION_DURATION_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export const sessionService = {
  /**
   * Cryptographically hash token before saving to database
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Create a new cryptographically secure random session
   */
  async createSession({ displayPhone, timezone = 'Asia/Kolkata', preferredLanguage = 'en' }) {
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const sessionId = `ds_${crypto.randomUUID()}`;
    const tokenHash = this.hashToken(rawSecret);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const sessionDoc = await DeviceSession.create({
      sessionId,
      tokenHash,
      displayPhone,
      isRevoked: false,
      expiresAt,
      lastActiveAt: new Date(),
      timezone,
      preferredLanguage
    });

    // JWT payload contains sessionId + rawSecret
    const cookieToken = jwt.sign(
      {
        sessionId,
        secret: rawSecret,
        isDeviceBound: true
      },
      env.JWT_SECRET,
      { expiresIn: '60d' }
    );

    return { sessionDoc, cookieToken, sessionId };
  },

  /**
   * Validate session token from cookie
   */
  async validateSessionToken(token) {
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      if (!decoded.sessionId || !decoded.secret || !decoded.isDeviceBound) {
        return null;
      }

      const session = await DeviceSession.findOne({ sessionId: decoded.sessionId });
      if (!session) return null;

      // Check revocation & expiry
      if (session.isRevoked || session.expiresAt < new Date()) {
        return null;
      }

      // Constant-time token hash verification
      const expectedHash = this.hashToken(decoded.secret);
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(session.tokenHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );

      if (!isMatch) return null;

      // Update lastActiveAt periodically (throttle to once per 5 minutes)
      const now = Date.now();
      if (!session.lastActiveAt || now - session.lastActiveAt.getTime() > 5 * 60 * 1000) {
        session.lastActiveAt = new Date();
        await session.save().catch(() => {});
      }

      return session;
    } catch {
      return null;
    }
  },

  /**
   * Revoke session (Logout or Reset)
   */
  async revokeSession(sessionId) {
    if (!sessionId) return;
    await DeviceSession.updateOne({ sessionId }, { isRevoked: true });
  },

  /**
   * Rotate session secret for enhanced security
   */
  async rotateSession(sessionId) {
    const session = await DeviceSession.findOne({ sessionId, isRevoked: false });
    if (!session) return null;

    const newSecret = crypto.randomBytes(32).toString('hex');
    session.tokenHash = this.hashToken(newSecret);
    session.lastActiveAt = new Date();
    await session.save();

    const newCookieToken = jwt.sign(
      {
        sessionId: session.sessionId,
        secret: newSecret,
        isDeviceBound: true
      },
      env.JWT_SECRET,
      { expiresIn: '60d' }
    );

    return { session, newCookieToken };
  }
};
