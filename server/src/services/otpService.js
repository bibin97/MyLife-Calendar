import { OtpSession } from '../models/OtpSession.js';
import { env } from '../config/env.js';

export const otpService = {
  /**
   * Generates or retrieves an OTP and saves the session
   */
  async requestOtp(phoneNumber) {
    const now = new Date();

    // Check existing active session for resend cooldown (e.g., 30s)
    const existing = await OtpSession.findOne({ phoneNumber }).sort({ createdAt: -1 });
    if (existing) {
      const secondsSinceLastSent = (now.getTime() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (secondsSinceLastSent < 30) {
        const waitSeconds = Math.ceil(30 - secondsSinceLastSent);
        const error = new Error(`Please wait ${waitSeconds}s before requesting a new OTP.`);
        error.statusCode = 429;
        throw error;
      }
    }

    // Generate 6-digit OTP
    let otpCode;
    const isDevOrTest = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
    if (isDevOrTest && env.DEV_MODE_OTP) {
      otpCode = env.DEV_MODE_OTP;
    } else {
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const expiresAt = new Date(now.getTime() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save or update session
    await OtpSession.deleteMany({ phoneNumber });
    const session = await OtpSession.create({
      phoneNumber,
      otp: otpCode,
      expiresAt,
      attempts: 0,
      lastSentAt: now
    });

    // Send SMS via configured provider
    await this.sendSms(phoneNumber, otpCode);

    return {
      success: true,
      expiresInMinutes: env.OTP_EXPIRY_MINUTES,
      // Only include devOtp in development or test mode for easy local testing
      ...(isDevOrTest ? { devOtp: otpCode } : {})
    };
  },

  /**
   * Verifies the OTP for a phone number
   */
  async verifyOtp(phoneNumber, inputOtp) {
    const session = await OtpSession.findOne({ phoneNumber }).sort({ createdAt: -1 });

    if (!session) {
      const error = new Error('No active OTP session found. Please request a new OTP.');
      error.statusCode = 400;
      throw error;
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      await OtpSession.deleteOne({ _id: session._id });
      const error = new Error('OTP has expired. Please request a new OTP.');
      error.statusCode = 400;
      throw error;
    }

    // Check attempts limit
    if (session.attempts >= env.MAX_OTP_ATTEMPTS) {
      await OtpSession.deleteOne({ _id: session._id });
      const error = new Error('Maximum verification attempts exceeded. Please request a new OTP.');
      error.statusCode = 429;
      throw error;
    }

    // Validate OTP
    if (session.otp !== inputOtp.trim()) {
      session.attempts += 1;
      await session.save();
      const remaining = env.MAX_OTP_ATTEMPTS - session.attempts;
      const error = new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
      error.statusCode = 400;
      throw error;
    }

    // Verification successful - remove session to prevent replay
    await OtpSession.deleteOne({ _id: session._id });
    return true;
  },

  /**
   * SMS Provider Dispatcher (Configurable)
   */
  async sendSms(phoneNumber, _otpCode) {
    if (env.NODE_ENV === 'production') {
      return;
    }

    switch (env.SMS_PROVIDER) {
      case 'twilio':
        console.log('[SMS-TWILIO] OTP dispatch invoked');
        break;
      case 'fast2sms':
        console.log('[SMS-FAST2SMS] OTP dispatch invoked');
        break;
      case 'mock':
      default:
        console.log(`[SMS-DEV/MOCK] OTP generated for testing (${phoneNumber})`);
        break;
    }
  }
};
