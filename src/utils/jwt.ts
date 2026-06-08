import jwt from 'jsonwebtoken';
import { IJwtPayload } from '../modules/auth/auth.types.js';
import AppError from './appError.js';
import { envVars } from '../config/envVars.js';

const JWT_SECRET = envVars.JWT_SECRET || 'your-super-secret-key-change-this';
const JWT_EXPIRES_IN = envVars.JWT_EXPIRES_IN || '15m';                         // 15 minutes for access token
const REFRESH_TOKEN_SECRET = envVars.REFRESH_TOKEN_SECRET || JWT_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = envVars.REFRESH_TOKEN_EXPIRES_IN || '7d';

export const generateAccessToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): IJwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid access token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Access token expired', 401);
    }
    throw new AppError('Authentication failed', 401);
  }
};

export const verifyRefreshToken = (token: string): IJwtPayload => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as IJwtPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired. Please login again', 401);
    }
    throw new AppError('Invalid refresh token', 401);
  }
};

export const getTokenExpiration = (): number => {
  // Return expiration in seconds (15 minutes)
  return 15 * 60;
};