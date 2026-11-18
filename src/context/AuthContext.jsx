import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import api, { getStoredToken } from '../services/api';

const AuthContext = createContext(null);

const saveSession = (jwtToken, guruData) => {
  localStorage.setItem('absensi_token', jwtToken);
  localStorage.setItem('token_guru', jwtToken);
  localStorage.setItem('absensi_guru', JSON.stringify(guruData));
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredToken());
  const [guru, setGuru] = useState(() => {
    try {
      const saved = localStorage.getItem('absensi_guru');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, nip: username, password });
      if (res.data?.success) {
        const { token: jwtToken, guru: guruData } = res.data;
        setToken(jwtToken);
        setGuru(guruData);
        saveSession(jwtToken, guruData);
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login gagal' };
    } catch (err) {
      // Fallback ke endpoint /auth/login utama bila login menggunakan akun Admin sekolah
      if (err.response?.status === 401) {
        try {
          const rootAuthUrl = import.meta.env.DEV
            ? '/auth-proxy/login'
            : `${(import.meta.env.VITE_API_BASE_URL || 'https://api.sdnragunan14pagi.sch.id/api').replace(/\/api\/?$/, '')}/auth/login`;
          const adminRes = await axios.post(rootAuthUrl, { username, nip: username, password });
          if (adminRes.data?.token) {
            const jwtToken = adminRes.data.token;
            const guruData = adminRes.data.guru || {
              id: 0,
              username,
              nip: username,
              nip_nikki: null,
              nama_guru: 'Administrator Sekolah',
              role: 'ADMIN',
              kelas_id: null,
              nama_kelas: null,
              kelas_mapel_ids: [],
              kelas_mapel: [],
            };
            setToken(jwtToken);
            setGuru(guruData);
            saveSession(jwtToken, guruData);
            return { success: true };
          }
        } catch {
          // Abaikan error fallback, kembalikan pesan error asli di bawah
        }
      }

      return {
        success: false,
        message:
          err.response?.data?.message ||
          'Koneksi ke server gagal. Harap periksa jaringan Anda atau coba beberapa saat lagi.',
      };
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentGuru = (patch) => {
    setGuru((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('absensi_guru', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setToken(null);
    setGuru(null);
    localStorage.removeItem('absensi_token');
    localStorage.removeItem('token_guru');
    localStorage.removeItem('token');
    localStorage.removeItem('absensi_guru');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        guru,
        login,
        logout,
        updateCurrentGuru,
        loading,
        isAuthenticated: Boolean(token),
      }}
    >
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
