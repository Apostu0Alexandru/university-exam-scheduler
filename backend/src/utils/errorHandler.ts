import { Response } from 'express';

export const handleError = (error: any, res: Response) => {
  console.error('Error:', error);
  
  // Handle Prisma-specific errors
  if (error.code) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return res.status(409).json({
          status: 'error',
          message: 'Resource already exists with the same unique fields',
        });
      case 'P2025': // Record not found
        return res.status(404).json({
          status: 'error',
          message: 'Record not found',
        });
      default:
        break;
    }
  }
  
  // Default error response
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}; 