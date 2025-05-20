import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleError } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Get all exams
export const getAllExams = async (req: Request, res: Response) => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        course: true,
        room: true,
      },
    });
    
    return res.json({
      status: 'success',
      data: exams,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Get exam by ID
export const getExamById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: true,
        room: true,
      },
    });
    
    if (!exam) {
      return res.status(404).json({
        status: 'error',
        message: 'Exam not found',
      });
    }
    
    return res.json({
      status: 'success',
      data: exam,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Get exams by course
export const getExamsByCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    
    const exams = await prisma.exam.findMany({
      where: { courseId },
      include: {
        course: true,
        room: true,
      },
    });
    
    return res.json({
      status: 'success',
      data: exams,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Get exams for a user based on their enrollments
export const getExamsForUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get all courses the user is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    
    const enrolledCourseIds = enrollments.map(enrollment => enrollment.courseId);
    
    // Get all exams for these courses
    const exams = await prisma.exam.findMany({
      where: {
        courseId: {
          in: enrolledCourseIds,
        },
      },
      include: {
        course: true,
        room: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    return res.json({
      status: 'success',
      data: exams,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Create a new exam
export const createExam = async (req: Request, res: Response) => {
  try {
    const { courseId, startTime, endTime, roomId, status } = req.body;
    
    // Validate input
    if (!courseId || !startTime || !endTime) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
    }
    
    // Check if course exists
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId },
    });
    
    if (!courseExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Course not found',
      });
    }
    
    // If roomId is provided, check if room exists
    if (roomId) {
      const roomExists = await prisma.room.findUnique({
        where: { id: roomId },
      });
      
      if (!roomExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Room not found',
        });
      }
    }
    
    // Create exam
    const newExam = await prisma.exam.create({
      data: {
        courseId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        roomId,
        status: status || 'SCHEDULED',
      },
      include: {
        course: true,
        room: true,
      },
    });
    
    return res.status(201).json({
      status: 'success',
      data: newExam,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Update an exam
export const updateExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { courseId, startTime, endTime, roomId, status } = req.body;
    
    // Check if exam exists
    const examExists = await prisma.exam.findUnique({
      where: { id },
    });
    
    if (!examExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Exam not found',
      });
    }
    
    // If courseId is provided, check if course exists
    if (courseId) {
      const courseExists = await prisma.course.findUnique({
        where: { id: courseId },
      });
      
      if (!courseExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Course not found',
        });
      }
    }
    
    // If roomId is provided, check if room exists
    if (roomId) {
      const roomExists = await prisma.room.findUnique({
        where: { id: roomId },
      });
      
      if (!roomExists) {
        return res.status(404).json({
          status: 'error',
          message: 'Room not found',
        });
      }
    }
    
    // Update exam
    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        courseId,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        roomId,
        status,
      },
      include: {
        course: true,
        room: true,
      },
    });
    
    return res.json({
      status: 'success',
      data: updatedExam,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Delete an exam
export const deleteExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if exam exists
    const examExists = await prisma.exam.findUnique({
      where: { id },
    });
    
    if (!examExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Exam not found',
      });
    }
    
    // Delete exam
    await prisma.exam.delete({
      where: { id },
    });
    
    return res.json({
      status: 'success',
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    return handleError(error, res);
  }
}; 