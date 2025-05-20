import axios from 'axios';
import { User, ApiResponse, StudyResource, LearningRecommendation, Exam } from '../types';
import { Clerk } from '@clerk/clerk-js';

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
  try {
    // Clerk is attached to window in browser
    const token = window.Clerk && (await window.Clerk.session?.getToken());
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`Adding auth token to request: – "${config.url}"`);
      console.log(`Full URL: ${API_URL}${config.url}`);
    } else {
      console.warn('No auth token available for request:', config.url);
    }
  } catch (err) {
    console.error('Error getting auth token:', err);
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`Request to ${response.config.url} succeeded: – ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`Request to ${error.config?.url} failed: – ${error.response?.status} – ${JSON.stringify(error.message)}`);
    console.error('Error details:', error);
    return Promise.reject(error);
  }
);

// User API
export const getUserProfile = async (): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.get<ApiResponse<{ user: User }>>('/users/me');
  return response.data;
};

// Exam API
export const getAllExams = async (): Promise<ApiResponse<Exam[]>> => {
  const response = await api.get<ApiResponse<Exam[]>>('/exams');
  return response.data;
};

export const getExamById = async (id: string): Promise<ApiResponse<Exam>> => {
  const response = await api.get<ApiResponse<Exam>>(`/exams/${id}`);
  return response.data;
};

export const getExamsByCourse = async (courseId: string): Promise<ApiResponse<Exam[]>> => {
  const response = await api.get<ApiResponse<Exam[]>>(`/exams/course/${courseId}`);
  return response.data;
};

export const getExamsForUser = async (userId: string): Promise<ApiResponse<Exam[]>> => {
  const response = await api.get<ApiResponse<Exam[]>>(`/exams/user/${userId}`);
  return response.data;
};

export const createExam = async (examData: Partial<Exam>): Promise<ApiResponse<Exam>> => {
  const response = await api.post<ApiResponse<Exam>>('/exams', examData);
  return response.data;
};

export const updateExam = async (id: string, examData: Partial<Exam>): Promise<ApiResponse<Exam>> => {
  const response = await api.put<ApiResponse<Exam>>(`/exams/${id}`, examData);
  return response.data;
};

export const deleteExam = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await api.delete<ApiResponse<{ message: string }>>(`/exams/${id}`);
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

export const createSampleResourcesForCourse = async (courseId: string): Promise<ApiResponse<any>> => {
  try {
    console.log(`Creating sample resources for course: ${courseId}`);
    const response = await api.post<ApiResponse<any>>(`/study-resources/sample/${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error creating sample resources:', error);
    throw error;
  }
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

// Course API
export const getAllCourses = async () => {
  const response = await api.get('/courses');
  // If your backend returns { status, data: { courses } }
  return { data: response.data.data.courses };
};

// Enrollment API
export const getUserEnrollments = async (userId: string) => {
  const response = await api.get(`/enrollments/user/${userId}`);
  return { data: response.data.data };
};

export const getAvailableCourses = async () => {
  const response = await api.get('/enrollments/available-courses');
  return { data: response.data.data };
};

export const enrollUserInCourse = async (userId: string, courseId: string, semester: string) => {
  try {
    console.log(`Enrolling user ${userId} in course ${courseId} for semester ${semester}`);
    const response = await api.post(`/enrollments/user/${userId}`, { 
      courseId, 
      semester 
    });
    return { data: response.data.data };
  } catch (error) {
    console.error('Error in enrollUserInCourse:', error);
    throw error;
  }
};

export const unenrollUserFromCourse = async (enrollmentId: string) => {
  const response = await api.delete(`/enrollments/${enrollmentId}`);
  return { data: response.data };
};

// Learning Preferences API
export const getUserLearningPreferences = async (userId: string) => {
  const response = await api.get(`/learning-preferences/user/${userId}`);
  return { data: response.data.data };
};

export const updateLearningPreference = async (userId: string, preferredType: string, studyDuration?: number) => {
  try {
    console.log(`Updating learning preferences for user ${userId}`);
    console.log(`URL: /learning-preferences/user/${userId}`);
    console.log(`Payload:`, { preferredType, studyDuration });
    
    const response = await api.post(`/learning-preferences/user/${userId}`, {
      preferredType,
      studyDuration
    });
    return { data: response.data.data };
  } catch (error) {
    console.error('Error in updateLearningPreference:', error);
    throw error;
  }
};

export const deleteLearningPreference = async (preferenceId: string) => {
  const response = await api.delete(`/learning-preferences/${preferenceId}`);
  return { data: response.data };
};

export default api;
