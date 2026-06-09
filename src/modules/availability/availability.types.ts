import { Types } from 'mongoose';

export interface IGetAvailableSlots {
  resourceId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  duration: number; // in minutes
  timezone?: string; // Override organization timezone
}

export interface IAvailableSlot {
  startTime: Date;
  endTime: Date;
  startTimeLocal: string;
  endTimeLocal: string;
  isAvailable: boolean;
}

export interface IAvailabilityResponse {
  resourceId: string;
  resourceName: string;
  date: string;
  timezone: string;
  workingHours: {
    start: string;
    end: string;
  };
  duration: number;
  availableSlots: IAvailableSlot[];
  totalAvailable: number;
  metadata: {
    bufferTimeApplied: {
      before: number;
      after: number;
    };
    workingHoursRespected: boolean;
    bookingWindowRespected: boolean;
  };
}

export interface ITimeSlot {
  start: Date;
  end: Date;
}

export interface IBlockedSlot {
  start: Date;
  end: Date;
  reason: 'booking' | 'buffer' | 'working_hours' | 'past' | 'booking_window';
}