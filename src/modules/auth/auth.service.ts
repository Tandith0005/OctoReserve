// src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../../models/User.model.js';
import { Organization } from '../../models/Organization.model.js';
import AppError from '../../utils/appError.js';
import { generateRefreshToken, verifyRefreshToken, generateAccessToken, getTokenExpiration } from '../../utils/jwt.js';
import { IRegisterUser, ILoginUser, IAuthResponse, IJwtPayload, ITokenResponse } from './auth.types.js';
import { UserRole, BookingStatus } from '../../types/index.js';
import mongoose from 'mongoose';
import { RefreshToken } from '../../models/RefreshToken.model.js';

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

    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      token: refreshToken,
      userId: user[0]._id,
      expiresAt,
      isRevoked: false,
    });

    return {
      user: {
        id: user[0]._id.toString(),
        name: user[0].name,
        email: user[0].email,
        role: user[0].role as UserRole,
        organizationId: user[0].organizationId.toString(),
      },
      accessToken,
      refreshToken,
      expiresIn: getTokenExpiration(),
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

  const accessToken = generateAccessToken(jwtPayload);
  const refreshToken = generateRefreshToken(jwtPayload);

  // Save refresh token to database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt,
    isRevoked: false,
  });

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organizationId.toString(),
    },
    accessToken,
    refreshToken,
    expiresIn: getTokenExpiration(),
  };
};

const refreshAccessToken = async (oldRefreshToken: string): Promise<ITokenResponse> => {
  // Verify refresh token
  const decoded = verifyRefreshToken(oldRefreshToken);
  
  // Check if refresh token exists in database and is not revoked
  const storedToken = await RefreshToken.findOne({
    token: oldRefreshToken,
    userId: decoded.userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!storedToken) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
  
  // Check if user still exists and is active
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }
  
  // Check organization is active
  const organization = await Organization.findById(user.organizationId);
  if (!organization || !organization.isActive) {
    throw new AppError('Organization is inactive. Please contact administrator', 401);
  }
  
  // Revoke the old refresh token (one-time use)
  storedToken.isRevoked = true;
  await storedToken.save();
  
  // Generate new tokens
  const jwtPayload: IJwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role as UserRole,
    organizationId: user.organizationId.toString(),
  };
  
  const newAccessToken = generateAccessToken(jwtPayload);
  const newRefreshToken = generateRefreshToken(jwtPayload);
  
  // Save new refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await RefreshToken.create({
    token: newRefreshToken,
    userId: user._id,
    expiresAt,
    isRevoked: false,
  });
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: getTokenExpiration(),
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

const logout = async (userId: string, refreshToken?: string): Promise<void> => {
  // Revoke the specific refresh token if provided
  if (refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken, userId },
      { isRevoked: true }
    );
  } else {
    // Revoke all refresh tokens for the user
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }
};

const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};

export const AuthService = {
  registerUser,
  loginUser,
  changePassword,
  refreshAccessToken,
  revokeAllUserTokens,
  logout,
};