import axios from 'axios';
import { User, ApiResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  // The Clerk token is typically handled by the frontend SDK
  // The accessToken will be sent to your backend and validated there
  return config;
});

// User API
export const getUserProfile = async (): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.get<ApiResponse<{ user: User }>>('/users/me');
  return response.data;
};

export default api;
