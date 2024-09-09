// src/axiosSetup.ts
import axios from 'axios';
import { refreshAccessToken } from './authenticate';
import { useNavigate } from 'react-router-dom';

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const navigate = useNavigate();

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const success = await refreshAccessToken();

      if (success) {
        const token = localStorage.getItem('accessToken');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
