import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,  // 30 seconds — external nutrition APIs can be slow
});

// Attach JWT token if present in localStorage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('calori_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If 401 unauthorized and not currently on login page, clear token
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('calori_token');
        localStorage.removeItem('calori_user');
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default client;
