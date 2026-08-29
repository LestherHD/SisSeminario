import axios from 'axios';

const apiConfigurada = import.meta.env.VITE_API_URL?.trim();
const apiInferida = `${window.location.protocol}//${window.location.hostname}:5000/api`;

const api = axios.create({
  // En desarrollo por red local usa automáticamente la IP con la que se abrió
  // el frontend. En producción se puede sobrescribir con VITE_API_URL.
  baseURL: (apiConfigurada || apiInferida).replace(/\/$/, ''),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
