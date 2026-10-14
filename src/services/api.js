import axios from 'axios';

// Semua route guru di backend berada di bawah prefix /api (lihat server.js: app.use('/api/...')).
// Mode development memakai proxy Vite (/api-proxy -> https://api.sdnragunan14pagi.sch.id/api)
// supaya browser tidak terkena CORS. Mode production memakai URL dari build arg / .env.
const baseURL = import.meta.env.DEV
  ? '/api-proxy'
  : import.meta.env.VITE_API_BASE_URL || 'https://api.sdnragunan14pagi.sch.id/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyematkan Bearer token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('absensi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor untuk tangani token kedaluwarsa atau tidak sah (401).
// Request login dikecualikan: 401 di sana berarti NIP/password salah, bukan sesi habis,
// dan pesan errornya harus tetap tampil di form login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const hadSession = Boolean(localStorage.getItem('absensi_token'));

    if (error.response?.status === 401 && !isLoginRequest && hadSession) {
      localStorage.removeItem('absensi_token');
      localStorage.removeItem('absensi_guru');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Ambil pesan error yang bisa dibaca guru dari respons backend
export const getErrorMessage = (err, fallback = 'Terjadi kesalahan. Coba lagi.') =>
  err?.response?.data?.message || (err?.request && !err?.response ? 'Tidak dapat terhubung ke server. Periksa koneksi internet.' : fallback);

// Service Absensi
export const getAbsensi = (params) => api.get('/absensi', { params });
export const saveAbsensiBatch = (rows) => api.post('/absensi', rows);

// Service Siswa
export const getMurid = (kelasId, q) => api.get('/murid', { params: { kelas_id: kelasId, q } });
export const createMurid = (data) => api.post('/murid', data);
export const createMuridBulk = (data) => api.post('/murid/bulk', data);
export const updateMurid = (id, data) => api.put(`/murid/${id}`, data);
export const deleteMurid = (id) => api.delete(`/murid/${id}`);

// Service Kelas
export const getKelas = () => api.get('/kelas');

export default api;
