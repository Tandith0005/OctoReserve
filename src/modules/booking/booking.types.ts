import { Types } from 'mongoose';
import { BookingStatus } from '../../types/index.js';

export interface ICreateBooking {
  resourceId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}

export interface IUpdateBooking {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface ICancelBooking {
  cancellationReason?: string;
}

export interface IBookingResponse {
  id: string;
  resourceId: string;
  resourceName?: string;
  organizationId: string;
  userId: string;
  userName?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: BookingStatus;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingFilters {
  resourceId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface IBookingConflict {
  hasConflict: boolean;
  conflictingBookings?: IBookingResponse[];
  message?: string;
}

export interface IBookingValidation {
  isValid: boolean;
  errors?: string[];
}