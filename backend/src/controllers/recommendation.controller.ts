import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleError } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Get all recommendations for a user
export const getUserRecommendations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const recommendations = await prisma.learningRecommendation.findMany({
      where: { userId },
      include: {
        course: true,
        resource: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });
    
    return res.json({
      status: 'success',
      data: recommendations,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Get recommendations for a user for a specific course
export const getUserCourseRecommendations = async (req: Request, res: Response) => {
  try {
    const { userId, courseId } = req.params;
    
    const recommendations = await prisma.learningRecommendation.findMany({
      where: { 
        userId,
        courseId,
      },
      include: {
        resource: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });
    
    return res.json({
      status: 'success',
      data: recommendations,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Create a recommendation
export const createRecommendation = async (req: Request, res: Response) => {
  try {
    const { userId, courseId, resourceId, reason, priority } = req.body;
    
    // Validate input
    if (!userId || !courseId || !resourceId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
    }
    
    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!userExists) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
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
    
    // Check if resource exists
    const resourceExists = await prisma.studyResource.findUnique({
      where: { id: resourceId },
    });
    
    if (!resourceExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Study resource not found',
      });
    }
    
    // Create recommendation
    const newRecommendation = await prisma.learningRecommendation.create({
      data: {
        userId,
        courseId,
        resourceId,
        reason: reason || 'Based on your enrollment',
        priority: priority || 0,
        completed: false,
      },
    });
    
    return res.status(201).json({
      status: 'success',
      data: newRecommendation,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Mark recommendation as completed
export const markRecommendationCompleted = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    // Check if recommendation exists
    const recommendationExists = await prisma.learningRecommendation.findUnique({
      where: { id },
    });
    
    if (!recommendationExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Recommendation not found',
      });
    }
    
    // Update recommendation
    const updatedRecommendation = await prisma.learningRecommendation.update({
      where: { id },
      data: {
        completed: completed !== undefined ? completed : true,
      },
    });
    
    return res.json({
      status: 'success',
      data: updatedRecommendation,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Delete recommendation
export const deleteRecommendation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if recommendation exists
    const recommendationExists = await prisma.learningRecommendation.findUnique({
      where: { id },
    });
    
    if (!recommendationExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Recommendation not found',
      });
    }
    
    // Delete recommendation
    await prisma.learningRecommendation.delete({
      where: { id },
    });
    
    return res.json({
      status: 'success',
      message: 'Recommendation deleted successfully',
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Generate recommendations for a user
export const generateRecommendationsForUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
        learningPreferences: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    // Get user preferences
    const preferences = user.learningPreferences;
    
    // Default to first preference or VIDEO if none exists
    const preferredType = preferences.length > 0 
      ? preferences[0].preferredType 
      : 'VIDEO';
    
    // Get all enrolled courses
    const enrolledCourseIds = user.enrollments.map(enrollment => enrollment.courseId);
    
    // Find study resources for enrolled courses
    const studyResources = await prisma.studyResource.findMany({
      where: {
        courseId: {
          in: enrolledCourseIds,
        },
      },
      include: {
        course: true,
      },
    });
    
    // Get existing recommendations to avoid duplicates
    const existingRecommendations = await prisma.learningRecommendation.findMany({
      where: {
        userId,
      },
    });
    
    const existingResourceIds = existingRecommendations.map(rec => rec.resourceId);
    
    // Create recommendations based on preferences
    const newRecommendations = [];
    
    for (const resource of studyResources) {
      // Skip already recommended resources
      if (existingResourceIds.includes(resource.id)) {
        continue;
      }
      
      // Calculate priority based on type match with user preferences
      let priority = 0;
      
      if (resource.type === preferredType) {
        priority += 10; // Higher priority for preferred type
      }
      
      // Create recommendation
      const recommendation = await prisma.learningRecommendation.create({
        data: {
          userId,
          courseId: resource.courseId,
          resourceId: resource.id,
          reason: `Recommended based on your enrollment in ${resource.course.name}`,
          priority,
          completed: false,
        },
      });
      
      newRecommendations.push(recommendation);
    }
    
    return res.json({
      status: 'success',
      message: `Generated ${newRecommendations.length} new recommendations`,
      data: newRecommendations,
    });
  } catch (error) {
    return handleError(error, res);
  }
}; 