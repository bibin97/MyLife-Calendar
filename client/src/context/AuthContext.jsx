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
        // Not authenticated or session expired — expected for logged out users
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

  const requestOtp = async (phoneNumber) => {
    setError(null);
    try {
      const data = await authService.requestOtp(phoneNumber);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
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

  const logout = async () => {
    const currentUserId = user?._id;
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      // Clear isolated offline cache for this user upon logout
      if (currentUserId) {
        offlineStorage.clearUserCache(currentUserId).catch(() => {});
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

  const value = {
    user,
    loading,
    error,
    devOtpHint,
    requestOtp,
    login,
    logout,
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
