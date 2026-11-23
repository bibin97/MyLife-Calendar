import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService.js';
import { offlineStorage } from '../services/offlineStorage.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devOtpHint, setDevOtpHint] = useState(null);

  // Restore session on application mount via HTTP-only cookie
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getMe();
        if (isMounted) setUser(currentUser);
      } catch (err) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Phone number entry to start or resume device session
   */
  const enterWithPhone = async (phoneNumber, timezone = 'Asia/Kolkata', preferredLanguage = 'en') => {
    setError(null);
    try {
      const data = await authService.startDeviceSession(phoneNumber, timezone, preferredLanguage);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to initialize session');
      throw err;
    }
  };

  /**
   * Leave Calendar / Logout: Clears cookie from browser
   */
  const logout = async () => {
    const currentId = user?._id;
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      if (currentId) {
        offlineStorage.clearUserCache(currentId).catch(() => {});
      }
      setUser(null);
      setDevOtpHint(null);
    }
  };

  /**
   * Reset Session: Revokes session in DB (destroys authorization token)
   */
  const resetSession = async () => {
    const currentId = user?._id;
    try {
      await authService.resetSession();
    } catch (err) {
      console.warn('Reset error:', err.message);
    } finally {
      if (currentId) {
        offlineStorage.clearUserCache(currentId).catch(() => {});
      }
      setUser(null);
      setDevOtpHint(null);
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Preserved OTP methods
  const requestOtp = async (phoneNumber) => {
    setError(null);
    try {
      const data = await authService.requestOtp(phoneNumber);
      if (data.devOtp) setDevOtpHint(data.devOtp);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (phoneNumber, otp) => {
    setError(null);
    try {
      const data = await authService.verifyOtp(phoneNumber, otp);
      setUser(data.user);
      setDevOtpHint(null);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    devOtpHint,
    enterWithPhone,
    login,
    logout,
    resetSession,
    requestOtp,
    updateProfile,
    clearError: () => setError(null)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
