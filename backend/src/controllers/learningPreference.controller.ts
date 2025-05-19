import { Request, Response } from 'express';
import { PrismaClient, ResourceType } from '@prisma/client';
import { handleError } from '../utils/errorHandler';

const prisma = new PrismaClient();

// Get learning preferences for a user
export const getUserLearningPreferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const preferences = await prisma.learningPreference.findMany({
      where: { userId },
    });
    
    return res.json({
      status: 'success',
      data: preferences,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Create or update learning preference
export const updateLearningPreference = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { preferredType, studyDuration } = req.body;
    
    // Validate input
    if (!preferredType) {
      return res.status(400).json({
        status: 'error',
        message: 'Preferred resource type is required',
      });
    }
    
    // Check if valid resource type
    const validResourceTypes = ['VIDEO', 'ARTICLE', 'PRACTICE_QUIZ', 'FLASHCARDS', 'TEXTBOOK', 'NOTES', 'OTHER'];
    if (!validResourceTypes.includes(preferredType)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid resource type',
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
    
    // Find existing preference
    const existingPreference = await prisma.learningPreference.findFirst({
      where: { userId },
    });
    
    let preference;
    
    if (existingPreference) {
      // Update existing preference
      preference = await prisma.learningPreference.update({
        where: { id: existingPreference.id },
        data: {
          preferredType: preferredType as ResourceType,
          studyDuration: studyDuration || existingPreference.studyDuration,
        },
      });
    } else {
      // Create new preference
      preference = await prisma.learningPreference.create({
        data: {
          userId,
          preferredType: preferredType as ResourceType,
          studyDuration: studyDuration || 30, // Default 30 minutes
        },
      });
    }
    
    return res.json({
      status: 'success',
      data: preference,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

// Delete learning preference
export const deleteLearningPreference = async (req: Request, res: Response) => {
  try {
    const { preferenceId } = req.params;
    
    // Check if preference exists
    const preference = await prisma.learningPreference.findUnique({
      where: { id: preferenceId },
    });
    
    if (!preference) {
      return res.status(404).json({
        status: 'error',
        message: 'Learning preference not found',
      });
    }
    
    // Delete preference
    await prisma.learningPreference.delete({
      where: { id: preferenceId },
    });
    
    return res.json({
      status: 'success',
      message: 'Learning preference deleted successfully',
    });
  } catch (error) {
    return handleError(error, res);
  }
}; 