// src/authenticate.ts
import axios from 'axios';

export const authenticate = async (username: string, password: string) => {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/login`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200 && response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token); // Store the token in localStorage
      localStorage.setItem('refreshToken', response.data.refresh_token); // Store the refresh token
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
};

export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const formData = new FormData();
    formData.append('refreshToken', refreshToken || '');

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/refresh-token`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200 && response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token); // Update the access token
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};
