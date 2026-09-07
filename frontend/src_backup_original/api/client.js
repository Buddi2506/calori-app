import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,  // 30 seconds — external nutrition APIs can be slow
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    // Could add global offline notification here
    return Promise.reject(error);
  }
);

export default client;
