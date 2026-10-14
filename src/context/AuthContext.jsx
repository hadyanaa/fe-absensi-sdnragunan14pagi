import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('absensi_token'));
  const [guru, setGuru] = useState(() => {
    try {
      const saved = localStorage.getItem('absensi_guru');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (nip, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { nip, password });
      if (res.data?.success) {
        const { token: jwtToken, guru: guruData } = res.data;
        setToken(jwtToken);
        setGuru(guruData);
        localStorage.setItem('absensi_token', jwtToken);
        localStorage.setItem('absensi_guru', JSON.stringify(guruData));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login gagal' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Koneksi ke server gagal. Harap periksa jaringan Anda atau coba beberapa saat lagi.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setGuru(null);
    localStorage.removeItem('absensi_token');
    localStorage.removeItem('absensi_guru');
  };

  return (
    <AuthContext.Provider value={{ token, guru, login, logout, loading, isAuthenticated: Boolean(token) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

