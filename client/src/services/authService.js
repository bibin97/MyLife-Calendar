import { api } from './api.js';

export const authService = {
  /**
   * Continuous entry: Reuses valid browser session or starts a new cryptographically isolated session
   */
  async startDeviceSession(phoneNumber, timezone = 'Asia/Kolkata', preferredLanguage = 'en') {
    const res = await api.post('/auth/device-session', {
      phoneNumber,
      timezone,
      preferredLanguage
    });
    return res.data;
  },

  /**
   * Leave / Logout: Clears cookie from browser without permanently revoking the session
   */
  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  /**
   * Reset Session: Permanently revokes the session in MongoDB
   */
  async resetSession() {
    const res = await api.post('/auth/reset-session');
    return res.data;
  },

  /**
   * Fetch current authenticated user / session
   */
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  /**
   * Update user / session profile
   */
  async updateProfile(profileData) {
    const res = await api.patch('/auth/profile', profileData);
    return res.data.user;
  },

  // Preserved OTP APIs
  async requestOtp(phoneNumber) {
    const res = await api.post('/auth/request-otp', { phoneNumber });
    return res.data;
  },

  async verifyOtp(phoneNumber, otp) {
    const res = await api.post('/auth/verify-otp', { phoneNumber, otp });
    return res.data;
  }
};
