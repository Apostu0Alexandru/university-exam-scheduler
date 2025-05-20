import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import Clerk from '@clerk/clerk-sdk-node';
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
    console.log('attachDatabaseUser:', req.auth);

    if (!req.auth?.userId) {
      console.log('No Clerk userId found');
      return next();
    }

    const clerkId = req.auth.userId;
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });
    console.log('User found in DB:', user);

    if (!user) {
      // Fetch user info from Clerk
      const clerkUser = await Clerk.users.getUser(clerkId);
      console.log('Fetched Clerk user:', clerkUser);

      const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';

      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName,
          lastName,
          role: 'STUDENT',
        },
      });
      console.log('Created new user in DB:', user);
    }

    if (user) {
      req.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
      };
      console.log('req.user set:', req.user);
    }

    next();
  } catch (error) {
    console.error('Error in attachDatabaseUser:', error);
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
