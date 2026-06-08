// src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../../models/User.model.js';
import { Organization } from '../../models/Organization.model.js';
import AppError from '../../utils/appError.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { IRegisterUser, ILoginUser, IAuthResponse, IJwtPayload } from './auth.types.js';
import { UserRole, BookingStatus } from '../../types/index.js';
import mongoose from 'mongoose';

const registerUser = async (payload: IRegisterUser): Promise<IAuthResponse> => {
  const { name, email, password, organizationId, role } = payload;

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    let orgId = organizationId;
    let userRole = role || UserRole.EMPLOYEE;

    // If no organizationId provided, create a new organization (ORG_ADMIN signup)
    if (!orgId) {
      // Check if this is the first user (should be ORG_ADMIN)
      if (userRole !== UserRole.ORG_ADMIN) {
        throw new AppError('First user in organization must be an ORG_ADMIN', 400);
      }

      // Create new organization
      const organization = await Organization.create([{
        name: `${name}'s Organization`,
        timezone: 'UTC',
        bookingConfig: {
          defaultDuration: 60,
          maxDuration: 480,
          minDuration: 15,
          bookingWindowDays: 30,
          workingHours: {
            start: '09:00',
            end: '17:00',
            workingDays: [1, 2, 3, 4, 5],
          },
          bufferTime: {
            before: 0,
            after: 0,
          },
        },
        isActive: true,
      }], { session });

      orgId = organization[0]._id.toString();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create([{
      name,
      email,
      password: hashedPassword,
      role: userRole,
      organizationId: orgId,
      isActive: true,
    }], { session });

    await session.commitTransaction();

    // Generate tokens
    const jwtPayload: IJwtPayload = {
      userId: user[0]._id.toString(),
      email: user[0].email,
      role: user[0].role as UserRole,
      organizationId: user[0].organizationId.toString(),
    };

    const token = generateToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    return {
      user: {
        id: user[0]._id.toString(),
        name: user[0].name,
        email: user[0].email,
        role: user[0].role as UserRole,
        organizationId: user[0].organizationId.toString(),
      },
      token,
      refreshToken,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const loginUser = async (payload: ILoginUser): Promise<IAuthResponse> => {
  const { email, password } = payload;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated. Please contact administrator', 401);
  }

  // Check organization is active
  const organization = await Organization.findById(user.organizationId);
  if (!organization || !organization.isActive) {
    throw new AppError('Organization is inactive. Please contact administrator', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const jwtPayload: IJwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role as UserRole,
    organizationId: user.organizationId.toString(),
  };

  const token = generateToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organizationId.toString(),
    },
    token,
    refreshToken,
  };
};

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();
};

const refreshToken = async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
  const decoded = verifyRefreshToken(refreshToken);
  
  // Check if user still exists and is active
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  const jwtPayload: IJwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role as UserRole,
    organizationId: user.organizationId.toString(),
  };

  const newToken = generateToken(jwtPayload);
  const newRefreshToken = generateRefreshToken(jwtPayload);

  return { token: newToken, refreshToken: newRefreshToken };
};

const logout = async (userId: string): Promise<void> => {
  // In a production app, you might want to blacklist the token
  // For now, just return success (client will remove token)
  // Optional: Store blacklisted tokens in Redis
  return;
};

export const AuthService = {
  registerUser,
  loginUser,
  changePassword,
  refreshToken,
  logout,
};