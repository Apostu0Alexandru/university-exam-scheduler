import axios from 'axios';
import { User, ApiResponse, StudyResource, LearningRecommendation } from '../types';

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

// Study Resources API
export const getAllStudyResources = async (): Promise<ApiResponse<StudyResource[]>> => {
  const response = await api.get<ApiResponse<StudyResource[]>>('/study-resources');
  return response.data;
};

export const getStudyResourcesByCourse = async (courseId: string): Promise<ApiResponse<StudyResource[]>> => {
  const response = await api.get<ApiResponse<StudyResource[]>>(`/study-resources/course/${courseId}`);
  return response.data;
};

export const getStudyResourceById = async (id: string): Promise<ApiResponse<StudyResource>> => {
  const response = await api.get<ApiResponse<StudyResource>>(`/study-resources/${id}`);
  return response.data;
};

// Recommendations API
export const getUserRecommendations = async (userId: string): Promise<ApiResponse<LearningRecommendation[]>> => {
  const response = await api.get<ApiResponse<LearningRecommendation[]>>(`/recommendations/user/${userId}`);
  return response.data;
};

export const getUserCourseRecommendations = async (userId: string, courseId: string): Promise<ApiResponse<LearningRecommendation[]>> => {
  const response = await api.get<ApiResponse<LearningRecommendation[]>>(`/recommendations/user/${userId}/course/${courseId}`);
  return response.data;
};

export const markRecommendationCompleted = async (id: string, completed: boolean = true): Promise<ApiResponse<LearningRecommendation>> => {
  const response = await api.patch<ApiResponse<LearningRecommendation>>(`/recommendations/${id}/complete`, { completed });
  return response.data;
};

export const generateRecommendationsForUser = async (userId: string): Promise<ApiResponse<LearningRecommendation[]>> => {
  const response = await api.post<ApiResponse<LearningRecommendation[]>>(`/recommendations/generate/${userId}`);
  return response.data;
};

export default api;
