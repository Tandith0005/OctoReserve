import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AuthService } from './auth.service.js';
import {
  registerValidationSchema,
  loginValidationSchema,
  changePasswordValidationSchema,
  refreshTokenValidationSchema,
} from './auth.validation.js';

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const validatedData = registerValidationSchema.parse(req.body);
  const result = await AuthService.registerUser(validatedData);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const validatedData = loginValidationSchema.parse(req.body);
  const result = await AuthService.loginUser(validatedData);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login successful',
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const validatedData = refreshTokenValidationSchema.parse(req.body);
  const result = await AuthService.refreshAccessToken(validatedData.refreshToken);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const validatedData = changePasswordValidationSchema.parse(req.body);
  const userId = req.user!.userId;

  await AuthService.changePassword(
    userId,
    validatedData.currentPassword,
    validatedData.newPassword
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password changed successfully. Please login again.',
    data: null,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  await AuthService.logout(req.user!.userId, refreshToken);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});


export const AuthController = {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  logout,
};