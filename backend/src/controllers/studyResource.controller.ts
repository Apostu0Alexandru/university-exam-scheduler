import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleError } from '../utils/errorHandler';

const prisma = new PrismaClient();

export const getAllStudyResources = async (req: Request, res: Response) => {
  try {
    const studyResources = await prisma.studyResource.findMany({
      include: {
        course: true,
      },
    });
    
    return res.json({
      status: 'success',
      data: studyResources,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getStudyResourceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const studyResource = await prisma.studyResource.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });
    
    if (!studyResource) {
      return res.status(404).json({
        status: 'error',
        message: 'Study resource not found',
      });
    }
    
    return res.json({
      status: 'success',
      data: studyResource,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getStudyResourcesByCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    
    const studyResources = await prisma.studyResource.findMany({
      where: { courseId },
      include: {
        course: true,
      },
    });
    
    return res.json({
      status: 'success',
      data: studyResources,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const createStudyResource = async (req: Request, res: Response) => {
  try {
    const { title, description, url, type, courseId } = req.body;
    
    // Validate input
    if (!title || !description || !url || !type || !courseId) {
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
    
    const newStudyResource = await prisma.studyResource.create({
      data: {
        title,
        description,
        url,
        type,
        courseId,
      },
    });
    
    return res.status(201).json({
      status: 'success',
      data: newStudyResource,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const updateStudyResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, url, type, courseId } = req.body;
    
    // Check if resource exists
    const studyResourceExists = await prisma.studyResource.findUnique({
      where: { id },
    });
    
    if (!studyResourceExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Study resource not found',
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
    
    const updatedStudyResource = await prisma.studyResource.update({
      where: { id },
      data: {
        title,
        description,
        url,
        type,
        courseId,
      },
    });
    
    return res.json({
      status: 'success',
      data: updatedStudyResource,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const deleteStudyResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if resource exists
    const studyResourceExists = await prisma.studyResource.findUnique({
      where: { id },
    });
    
    if (!studyResourceExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Study resource not found',
      });
    }
    
    await prisma.studyResource.delete({
      where: { id },
    });
    
    return res.json({
      status: 'success',
      message: 'Study resource deleted successfully',
    });
  } catch (error) {
    return handleError(error, res);
  }
}; 