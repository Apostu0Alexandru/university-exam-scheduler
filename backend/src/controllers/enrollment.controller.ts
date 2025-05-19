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
    
    if (!courseId || !semester) {
      return res.status(400).json({
        status: 'error',
        message: 'Course ID and semester are required',
      });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    
    if (!course) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
      });
    }
    
    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        semester,
      },
    });
    
    if (existingEnrollment) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already enrolled in this course for the specified semester',
      });
    }
    
    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        semester,
      },
      include: {
        course: true,
      },
    });
    
    return res.status(201).json({
      status: 'success',
      data: enrollment,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
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