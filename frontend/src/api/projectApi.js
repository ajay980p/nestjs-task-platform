import axiosClient from './axiosClient';

export const projectApi = {
  getAll: async () => {
    // Backend automatically returns all projects for ADMIN or only assigned projects for USER
    const response = await axiosClient.get('/projects');
    return response.data;
  },

  getMyProjects: async () => {
    // userId token se automatically extract ho jayega backend me
    const response = await axiosClient.get('/projects/my');
    return response.data;
  },

  getById: async (projectId) => {
    const response = await axiosClient.get(`/projects/${projectId}`);
    return response.data;
  },

  create: async (data) => {
    // userId token se automatically extract ho jayega backend me
    const response = await axiosClient.post('/projects', {
      dto: data,
    });
    return response.data;
  },

  update: async (projectId, data) => {
    const response = await axiosClient.patch(`/projects/${projectId}`, data);
    return response.data;
  },
};

