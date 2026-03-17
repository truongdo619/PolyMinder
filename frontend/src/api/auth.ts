import axiosInstance from '../axiosSetup';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axiosInstance.post(`${BASE_URL}/login`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (response.status === 200 && response.data.access_token) {
      localStorage.setItem('username', username);
      localStorage.setItem('accessToken', response.data.access_token);
      localStorage.setItem('refreshToken', response.data.refresh_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await axiosInstance.post(
      `${BASE_URL}/register`,
      { username, email, password },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.status === 200) {
      return { success: true };
    }
    return { success: false, message: 'Registration failed. Please try again.' };
  } catch (error) {
    const axiosErr = error as { response?: { data?: { detail?: string } } };
    const errorMessage =
      axiosErr.response?.data?.detail || 'An unexpected error occurred. Please try again.';
    return { success: false, message: 'Registration failed. ' + errorMessage };
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  await axiosInstance.post(
    `${BASE_URL}/forget-password/`,
    { email },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void> {
  const token = localStorage.getItem('accessToken');
  await axiosInstance.post(
    `${BASE_URL}/reset-password/`,
    { token: resetToken, new_password: newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}
