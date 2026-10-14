import axios from 'axios';

// Pada mode development, gunakan proxy Vite (/api-proxy) untuk menghindari CORS browser.
// Pada mode production, gunakan domain langsung atau nilai dari .env.
const defaultBaseUrl = import.meta.env.DEV
  ? '/api-proxy'
  : 'https://api.sdnragunan14pagi.sch.id';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
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

// Interceptor untuk tangani token kedaluwarsa atau tidak sah (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('absensi_token');
      localStorage.removeItem('absensi_guru');
      // Bila bukan di halaman login, reload agar AuthContext kembali ke login
      if (!window.location.pathname.includes('/login')) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;

