import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  theme: 'dark' | 'light';
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string }) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lifeos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lifeos_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('lifeos_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lifeos_theme', theme);
  }, [theme]);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('lifeos_user', JSON.stringify(profile));
        } catch (err) {
          console.error('Session restore failed:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    const handleExpired = () => logout();
    window.addEventListener('lifeos_auth_expired', handleExpired);
    return () => window.removeEventListener('lifeos_auth_expired', handleExpired);
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem('lifeos_token', res.access_token);
      localStorage.setItem('lifeos_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; full_name: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem('lifeos_token', res.access_token);
      localStorage.setItem('lifeos_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin();
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem('lifeos_token', res.access_token);
      localStorage.setItem('lifeos_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('lifeos_token');
    localStorage.removeItem('lifeos_user');
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateUser = async (data: Partial<User>) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
    localStorage.setItem('lifeos_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        theme,
        login,
        register,
        demoLogin,
        logout,
        toggleTheme,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
