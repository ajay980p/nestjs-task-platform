import axiosClient from './axiosClient';

export const taskApi = {
  getByProject: async (projectId) => {
    const response = await axiosClient.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  updateStatus: async (taskId, status) => {
    const response = await axiosClient.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post('/tasks', data);
    return response.data;
  },
};

