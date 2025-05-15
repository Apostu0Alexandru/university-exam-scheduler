import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';
import { ApiError } from './error.middleware';

const prisma = new PrismaClient();

// Update the Express Request interface to include auth property from Clerk
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
        sessionClaims?: {
          email?: string;
          firstName?: string;
          lastName?: string;
          [key: string]: any;
        };
        [key: string]: any;
      };
      user?: {
        id: string;
        clerkId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Clerk authentication middleware
export const requireAuth = ClerkExpressRequireAuth();

// User lookup middleware to attach our database user to the request
export const attachDatabaseUser: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      return next();
    }

    const clerkId = req.auth.userId;
    
    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });
    
    if (!user && req.auth.sessionClaims?.email) {
      // Create a new user with data from Clerk
      const firstName = req.auth.sessionClaims.firstName as string || '';
      const lastName = req.auth.sessionClaims.lastName as string || '';
      const email = req.auth.sessionClaims.email as string;
      
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName,
          lastName,
          role: 'STUDENT', // Default role
        },
      });
    }
    
    if (user) {
      // Attach user to request
      req.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
      };
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    
    next();
  };
};
