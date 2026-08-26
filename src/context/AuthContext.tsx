import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthSessionPayload, UserRole } from '../types';
import { api, getStoredToken, setStoredToken } from '../lib/api';

export interface PendingNotice {
  message: string;
  user?: {
    fullName?: string;
    rollNumber?: string;
    batch?: string;
    section?: string;
    email?: string;
  };
  submittedAt?: string;
}

interface AuthContextType {
  user: AuthSessionPayload | null;
  loading: boolean;
  login: (emailOrRoll: string, password: string) => Promise<{ success: boolean; isPending?: boolean; error?: string }>;
  quickLogin: (role?: UserRole, email?: string) => Promise<void>;
  registerStudent: (formData: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  pendingNotice: PendingNotice | null;
  clearPendingNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthSessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingNotice, setPendingNotice] = useState<PendingNotice | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
        setStoredToken(null);
      }
    } catch (err: any) {
      console.warn('Session restoration error:', err.message);
      setUser(null);
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check initial session
    refreshUser();
  }, [refreshUser]);

  const login = async (
    emailOrRoll: string,
    password: string
  ): Promise<{ success: boolean; isPending?: boolean; error?: string }> => {
    try {
      setPendingNotice(null);
      setStoredToken(null);
      setUser(null);
      const res = await api.login(emailOrRoll, password);
      if (res.success && res.token && res.user) {
        setStoredToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed. Please verify credentials.' };
    } catch (err: any) {
      const isPending =
        err?.data?.approval === 'pending' ||
        (typeof err?.data?.error === 'string' && err.data.error.toLowerCase().includes('pending')) ||
        (typeof err?.message === 'string' && err.message.toLowerCase().includes('pending'));

      if (isPending) {
        const friendlyMessage =
          err.data?.error ||
          'Your student account registration has been submitted and is currently pending verification by your Class Captain or Academic Administrator.';
        setPendingNotice({
          message: friendlyMessage,
          user: err.data?.user,
          submittedAt: new Date().toISOString(),
        });
        return {
          success: false,
          isPending: true,
          error: friendlyMessage,
        };
      }
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const quickLogin = async (role?: UserRole, email?: string) => {
    try {
      setLoading(true);
      setPendingNotice(null);
      setStoredToken(null);
      setUser(null);
      const res = await api.quickLogin(role, email);
      if (res.success && res.token && res.user) {
        setStoredToken(res.token);
        setUser(res.user);
      }
    } catch (err: any) {
      console.error('Quick login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (formData: any): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await api.register(formData);
      if (res.success) {
        setPendingNotice({
          message: res.message,
          user: {
            fullName: formData.fullName,
            rollNumber: formData.rollNumber,
            batch: formData.batch,
            section: formData.section,
          },
        });
        return { success: true, message: res.message };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setUser(null);
      setPendingNotice(null);
    }
  };

  const clearPendingNotice = () => setPendingNotice(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        quickLogin,
        registerStudent,
        logout,
        refreshUser,
        pendingNotice,
        clearPendingNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
