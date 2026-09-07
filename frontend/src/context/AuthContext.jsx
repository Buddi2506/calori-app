import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('calori_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('calori_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Validate token and fetch latest user info on mount
  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('calori_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return null;
    }
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('calori_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      logout();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (usernameOrEmail, password) => {
    const data = await authApi.login(usernameOrEmail, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('calori_token', data.access_token);
    localStorage.setItem('calori_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('calori_token');
    localStorage.removeItem('calori_user');
  };

  const changePassword = async (newPassword, oldPassword = null) => {
    await authApi.changePassword(newPassword, oldPassword);
    if (user) {
      const updated = { ...user, must_change_password: false };
      setUser(updated);
      localStorage.setItem('calori_user', JSON.stringify(updated));
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    mustChangePassword: Boolean(user?.must_change_password),
    isLoading,
    login,
    logout,
    changePassword,
    refreshUser,
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

export default AuthProvider;
