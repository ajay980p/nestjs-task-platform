import axiosClient from './axiosClient';

export const authApi = {
  login: async (data) => {
    const response = await axiosClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data) => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await axiosClient.get('/auth/users');
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post('/auth/logout');
    return response.data;
  },
};

