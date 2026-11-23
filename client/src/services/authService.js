import { api } from './api.js';

export const authService = {
  /**
   * Request OTP for a phone number
   */
  async requestOtp(phoneNumber) {
    const res = await api.post('/auth/request-otp', { phoneNumber });
    return res.data;
  },

  /**
   * Verify OTP and establish HTTP-only session
   */
  async verifyOtp(phoneNumber, otp) {
    const res = await api.post('/auth/verify-otp', { phoneNumber, otp });
    return res.data;
  },

  /**
   * Logout user and clear session cookie
   */
  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  /**
   * Fetch current authenticated user
   */
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  /**
   * Update user profile (displayName, preferredLanguage, timezone)
   */
  async updateProfile(profileData) {
    const res = await api.patch('/auth/profile', profileData);
    return res.data.user;
  }
};
