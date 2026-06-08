import { Request, Response, NextFunction } from 'express';

import AppError from '../utils/appError.js';
import { UserRole } from '../types/index.js';

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions', 403));
    }

    next();
  };
};

// Specific role middlewares for convenience
export const requireOrgAdmin = roleMiddleware([UserRole.ORG_ADMIN]);
export const requireEmployee = roleMiddleware([UserRole.ORG_ADMIN, UserRole.EMPLOYEE]);