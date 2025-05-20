import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all enrollments for a user
export const getUserEnrollments = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: true,
      },
    });
    
    return res.json({
      status: 'success',
      data: enrollments,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

// Enroll a user in a course
export const enrollUserInCourse = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { courseId, semester } = req.body;
    
    console.log('Enrollment attempt:', { userId, courseId, semester });
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    // Validate required fields
    if (!courseId) {
      return res.status(400).json({
        status: 'error',
        message: 'Course ID is required',
        details: { received: { courseId } }
      });
    }
    
    if (!semester) {
      return res.status(400).json({
        status: 'error',
        message: 'Semester is required',
        details: { received: { semester } }
      });
    }
    
    // Extract clerkId from userId if it's in the format "user_xxx"
    const clerkId = userId.startsWith('user_') ? userId : null;
    console.log('Extracted clerk ID:', clerkId);
    
    // Check if user exists by clerkId
    let user;
    if (clerkId) {
      user = await prisma.user.findFirst({
        where: { clerkId },
      });
      console.log('Found user by clerkId:', user);
    } else {
      // Fallback to finding by userId
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
      console.log('Found user by id:', user);
    }
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        details: {
          userId,
          clerkId,
          reason: 'No user found with this ID or Clerk ID'
        }
      });
    }
    
    // Use the actual database user.id
    const dbUserId = user.id;
    console.log('Using database user ID:', dbUserId);
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
        details: { courseId }
      });
    }
    
    console.log('Found course:', course.name);
    
    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: dbUserId, 
        courseId,
        semester,
      },
    });
    
    if (existingEnrollment) {
      console.log('User already enrolled in this course:', existingEnrollment);
      return res.status(400).json({
        status: 'error',
        message: 'User is already enrolled in this course for the specified semester',
        details: {
          userId: dbUserId,
          courseId,
          semester,
          enrollmentId: existingEnrollment.id
        }
      });
    }
    
    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: dbUserId,
        courseId,
        semester,
      },
      include: {
        course: true,
      },
    });
    
    console.log('Created enrollment:', enrollment);
    
    return res.status(201).json({
      status: 'success',
      data: enrollment,
    });
  } catch (error) {
    console.error('Error in enrollUserInCourse:', error);
    let errorMessage = 'An unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle common Prisma errors
      if (error.message.includes('foreign key constraint')) {
        errorMessage = 'Invalid user ID or course ID';
        statusCode = 400;
      } else if (error.message.includes('Unique constraint')) {
        errorMessage = 'User is already enrolled in this course for the specified semester';
        statusCode = 400;
      }
    }
    
    return res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
      details: error instanceof Error ? { stack: error.stack } : undefined
    });
  }
};

// Remove a user from a course
export const unenrollUserFromCourse = async (req: Request, res: Response) => {
  try {
    const { enrollmentId } = req.params;
    
    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    
    if (!enrollment) {
      return res.status(404).json({
        status: 'error',
        message: 'Enrollment not found',
      });
    }
    
    // Delete the enrollment
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });
    
    return res.json({
      status: 'success',
      message: 'User has been unenrolled from the course',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

// Get available courses for enrollment
export const getAvailableCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        code: 'asc',
      },
    });
    
    return res.json({
      status: 'success',
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}; 