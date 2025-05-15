import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { ApiError } from '../middlewares/error.middleware';

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, department } = req.body;

    if (!code || !name || !department) {
      throw new ApiError(400, 'Missing required fields');
    }

    const course = await prisma.course.create({
      data: {
        code,
        name,
        department,
      },
    });

    res.status(201).json({ status: 'success', data: { course } });
  } catch (error) {
    next(error);
  }
};

export const getAllCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await prisma.course.findMany();
    res.status(200).json({ status: 'success', data: { courses } });
  } catch (error) {
    next(error);
  }
};

// Implement similar methods for getCourseById, updateCourse, and deleteCourse
