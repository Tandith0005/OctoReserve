import { z } from 'zod';
import { BookingStatus } from '../../types/index.js';

export const createBookingSchema = z.object({
  resourceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource ID'),
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  startTime: z.string()
    .datetime({ offset: true })
    .transform(str => new Date(str)),
  endTime: z.string()
    .datetime({ offset: true })
    .transform(str => new Date(str)),
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const updateBookingSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  startTime: z.string()
    .datetime({ offset: true })
    .transform(str => new Date(str))
    .optional(),
  endTime: z.string()
    .datetime({ offset: true })
    .transform(str => new Date(str))
    .optional(),
}).refine(data => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const cancelBookingSchema = z.object({
  cancellationReason: z.string()
    .max(500, 'Cancellation reason must not exceed 500 characters')
    .optional(),
});

export const bookingIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
});

export const bookingFiltersSchema = z.object({
  resourceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource ID').optional(),
  status: z.enum([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.COMPLETED]).optional(),
  startDate: z.string().datetime().transform(str => new Date(str)).optional(),
  endDate: z.string().datetime().transform(str => new Date(str)).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});