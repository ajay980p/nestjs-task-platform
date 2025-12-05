import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // Important: This sends cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

