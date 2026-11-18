import axios from 'axios';

// Semua route modul absensi, murid, guru, dan kelas berada di bawah prefix /api.
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

export const getStoredToken = () =>
  localStorage.getItem('absensi_token') ||
  localStorage.getItem('token_guru') ||
  localStorage.getItem('token');

// Interceptor untuk menyematkan Bearer token JWT
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor untuk tangani token kedaluwarsa atau tidak sah (401).
// Request login dikecualikan agar pesan NIP/password salah tetap tampil di form login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const hadSession = Boolean(getStoredToken());

    if (error.response?.status === 401 && !isLoginRequest && hadSession) {
      localStorage.removeItem('absensi_token');
      localStorage.removeItem('token_guru');
      localStorage.removeItem('token');
      localStorage.removeItem('absensi_guru');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Ambil pesan error yang jelas dari respons backend
export const getErrorMessage = (err, fallback = 'Terjadi kesalahan. Coba lagi.') =>
  err?.response?.data?.message ||
  (err?.request && !err?.response
    ? 'Tidak dapat terhubung ke server. Periksa koneksi internet.'
    : fallback);

// Service Absensi
export const getAbsensi = (params) => api.get('/absensi', { params });
export const saveAbsensiBatch = (rows) => api.post('/absensi', rows);

// Service Siswa (/api/murid)
export const getMurid = (kelasId, q, status) =>
  api.get('/murid', {
    params: {
      ...(kelasId ? { kelas_id: kelasId } : {}),
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
    },
  });
export const getMuridHistory = (id, tahunAjaran) =>
  api.get(`/murid/${id}/history`, {
    params: tahunAjaran ? { tahun_ajaran: tahunAjaran } : undefined,
  });
export const createMurid = (data) => api.post('/murid', data);
export const createMuridBulk = (data) => api.post('/murid/bulk', data);
export const promoteMurid = (data) => api.post('/murid/promote', data);
export const updateMurid = (id, data) => api.put(`/murid/${id}`, data);
export const deleteMurid = (id) => api.delete(`/murid/${id}`);

// Service Kelas (/api/kelas)
export const getKelas = () => api.get('/kelas');
export const createKelas = (data) => api.post('/kelas', data);
export const updateKelas = (id, data) => api.put(`/kelas/${id}`, data);
export const deleteKelas = (id, force = false) =>
  api.delete(`/kelas/${id}`, { params: force ? { force: 'true' } : undefined });

// Service Guru (/api/guru)
export const getGuru = () => api.get('/guru');
export const createGuru = (data) => api.post('/guru', data);
export const updateGuru = (id, data) => api.put(`/guru/${id}`, data);
export const deleteGuru = (id) => api.delete(`/guru/${id}`);

export default api;
