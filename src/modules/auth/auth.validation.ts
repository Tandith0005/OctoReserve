import { z } from 'zod';
import { UserRole } from '../../types/index.js';

// Register validation schema
export const registerValidationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .trim(),
  
  email: z
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must not exceed 50 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  
  organizationId: z.string().optional(),
  role: z.enum([UserRole.EMPLOYEE, UserRole.ORG_ADMIN]).optional(),
});

// Login validation schema
export const loginValidationSchema = z.object({
  email: z
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(1, 'Password is required'),
});

// Change password validation
export const changePasswordValidationSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must not exceed 50 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
});

export const refreshTokenValidationSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutValidationSchema = z.object({
  refreshToken: z.string().optional(),
});