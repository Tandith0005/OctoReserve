import { Request, Response, NextFunction } from 'express';
import AppError from '../../utils/appError.js';
import { verifyToken } from '../../utils/jwt.js';
import { User } from '../../models/User.model.js';


export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
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