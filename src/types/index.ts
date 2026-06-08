// src/types/index.ts
import mongoose, { Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface IOrganization extends Document {
  name: string;
  timezone: string;
  bookingConfig: {
    defaultDuration: number; // in minutes
    maxDuration: number; // in minutes
    minDuration: number; // in minutes
    bookingWindowDays: number; // how far in advance can book
    workingHours: {
      start: string; // "09:00"
      end: string;   // "17:00"
      workingDays: number[]; // 0 = Sunday, 6 = Saturday
    };
    bufferTime: {
      before: number; // minutes before booking
      after: number;  // minutes after booking
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'ORG_ADMIN' | 'EMPLOYEE';
  organizationId: Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResource extends Document {
  name: string;
  type: 'MEETING_ROOM' | 'DESK' | 'DEVICE' | 'OTHER';
  organizationId: Types.ObjectId;
  capacity?: number;
  location?: string;
  amenities?: string[];
  bufferTime?: {
    before: number;
    after: number;
  };
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking extends Document {
  resourceId: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancellationReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResourceAvailability {
  resourceId: Types.ObjectId;
  date: Date;
  slots: Array<{
    start: Date;
    end: Date;
    isAvailable: boolean;
  }>;
}

export enum UserRole {
  ORG_ADMIN = 'ORG_ADMIN',
  EMPLOYEE = 'EMPLOYEE'
}

export enum ResourceType {
  MEETING_ROOM = 'MEETING_ROOM',
  DESK = 'DESK',
  DEVICE = 'DEVICE',
  OTHER = 'OTHER'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}