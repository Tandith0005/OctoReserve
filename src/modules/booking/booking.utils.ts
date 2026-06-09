import { DateTime } from 'luxon';
import { IBookingValidation } from './booking.types.js';

export const validateBookingDuration = (
  startTime: Date,
  endTime: Date,
  minDuration: number,
  maxDuration: number
): IBookingValidation => {
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  if (durationMinutes < minDuration) {
    return {
      isValid: false,
      errors: [`Booking duration must be at least ${minDuration} minutes`],
    };
  }
  
  if (durationMinutes > maxDuration) {
    return {
      isValid: false,
      errors: [`Booking duration must not exceed ${maxDuration} minutes`],
    };
  }
  
  return { isValid: true };
};

export const validateWorkingHours = (
  startTime: Date,
  endTime: Date,
  workingHours: { start: string; end: string; workingDays: number[] },
  timezone: string
): IBookingValidation => {
  const startInTz = DateTime.fromJSDate(startTime).setZone(timezone);
  const endInTz = DateTime.fromJSDate(endTime).setZone(timezone);
  
  // Check if same day
  if (!startInTz.hasSame(endInTz, 'day')) {
    return {
      isValid: false,
      errors: ['Bookings cannot span across multiple days'],
    };
  }
  
  // Check if day is a working day
  const dayOfWeek = startInTz.weekday; // 1-7 where Monday is 1
  const adjustedDay = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert to 0-6 where Sunday is 0
  if (!workingHours.workingDays.includes(adjustedDay)) {
    return {
      isValid: false,
      errors: [`Bookings are not allowed on ${startInTz.toFormat('cccc')}`],
    };
  }
  
  // Parse working hours
  const [workStartHour, workStartMinute] = workingHours.start.split(':').map(Number);
  const [workEndHour, workEndMinute] = workingHours.end.split(':').map(Number);
  
  const workStart = startInTz.set({ hour: workStartHour, minute: workStartMinute, second: 0 });
  const workEnd = startInTz.set({ hour: workEndHour, minute: workEndMinute, second: 0 });
  
  // Check if booking is within working hours
  if (startInTz < workStart || endInTz > workEnd) {
    return {
      isValid: false,
      errors: [`Booking must be within working hours (${workingHours.start} - ${workingHours.end})`],
    };
  }
  
  return { isValid: true };
};

export const validateBookingWindow = (
  startTime: Date,
  bookingWindowDays: number
): IBookingValidation => {
  const now = new Date();
  const maxFutureDate = new Date();
  maxFutureDate.setDate(now.getDate() + bookingWindowDays);
  
  if (startTime < now) {
    return {
      isValid: false,
      errors: ['Cannot create bookings in the past'],
    };
  }
  
  if (startTime > maxFutureDate) {
    return {
      isValid: false,
      errors: [`Bookings can only be made ${bookingWindowDays} days in advance`],
    };
  }
  
  return { isValid: true };
};

export const applyBufferTime = (
  startTime: Date,
  endTime: Date,
  bufferBefore: number,
  bufferAfter: number
): { bufferedStart: Date; bufferedEnd: Date } => {
  const bufferedStart = new Date(startTime.getTime() - bufferBefore * 60 * 1000);
  const bufferedEnd = new Date(endTime.getTime() + bufferAfter * 60 * 1000);
  
  return { bufferedStart, bufferedEnd };
};