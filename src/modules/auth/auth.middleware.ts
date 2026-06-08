import { Request, Response, NextFunction } from 'express';
import AppError from '../../utils/appError.js';
import { verifyAccessToken } from '../../utils/jwt.js';
import { User } from '../../models/User.model.js';
import { logger } from '../../utils/logger.js';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.log('AUTH HEADER:', req.headers);
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No access token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify access token
    const decoded = verifyAccessToken(token);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Attach user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};