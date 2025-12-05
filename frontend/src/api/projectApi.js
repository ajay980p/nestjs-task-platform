import axiosClient from './axiosClient';

export const projectApi = {
  getAll: async () => {
    const response = await axiosClient.get('/projects');
    return response.data;
  },

  getMyProjects: async (userId) => {
    const response = await axiosClient.get(`/projects/my?userId=${userId}`);
    return response.data;
  },

  getById: async (projectId) => {
    const response = await axiosClient.get(`/projects/${projectId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post('/projects', data);
    return response.data;
  },
};

