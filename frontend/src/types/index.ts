export type User = {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
};

export type Course = {
  id: string;
  code: string;
  name: string;
  department: string;
  createdAt: string;
  updatedAt: string;
};

export type Exam = {
  id: string;
  courseId: string;
  course?: Course;
  startTime: string;
  endTime: string;
  roomId?: string;
  room?: Room;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED';
  createdAt: string;
  updatedAt: string;
};

export type Room = {
  id: string;
  building: string;
  number: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  semester: string;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  examId: string;
  exam?: Exam;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ResourceType = 'VIDEO' | 'ARTICLE' | 'PRACTICE_QUIZ' | 'FLASHCARDS' | 'TEXTBOOK' | 'NOTES' | 'OTHER';

export type StudyResource = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  courseId: string;
  course?: Course;
  createdAt: string;
  updatedAt: string;
};

export type LearningPreference = {
  id: string;
  userId: string;
  preferredType: ResourceType;
  studyDuration: number; // in minutes
  createdAt: string;
  updatedAt: string;
};

export type LearningRecommendation = {
  id: string;
  userId: string;
  courseId: string;
  resourceId: string;
  reason: string;
  priority: number;
  completed: boolean;
  course?: Course;
  resource?: StudyResource;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  status: string;
  data: T;
};
