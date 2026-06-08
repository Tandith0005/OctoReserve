import { DateTime, Interval, Duration } from 'luxon';

export class DateTimeUtils {
  /**
   * Get current time in organization's timezone
   */
  static getCurrentTimeInTimezone(timezone: string): DateTime {
    return DateTime.now().setZone(timezone);
  }

  /**
   * Convert a date to organization's timezone
   */
  static convertToTimezone(date: Date | string, timezone: string): DateTime {
    return DateTime.fromJSDate(new Date(date)).setZone(timezone);
  }

  /**
   * Check if a time slot is within working hours
   */
  static isWithinWorkingHours(
    dateTime: DateTime,
    workingHours: { start: string; end: string },
    timezone: string
  ): boolean {
    const localDateTime = dateTime.setZone(timezone);
    const currentTime = localDateTime.toFormat('HH:mm');
    
    return currentTime >= workingHours.start && currentTime <= workingHours.end;
  }

  /**
   * Check if a date is a working day
   */
  static isWorkingDay(
    dateTime: DateTime,
    workingDays: number[],
    timezone: string
  ): boolean {
    const localDateTime = dateTime.setZone(timezone);
    const dayOfWeek = localDateTime.weekday; // Luxon: Monday=1, Sunday=7
    
    // Convert Luxon weekday (1-7) to our stored format (0-6 where 0=Sunday)
    const ourDayFormat = dayOfWeek === 7 ? 0 : dayOfWeek;
    return workingDays.includes(ourDayFormat);
  }

  /**
   * Generate available time slots for a given date
   */
  static generateTimeSlots(
    date: Date,
    duration: number,
    workingHours: { start: string; end: string },
    bufferTime: { before: number; after: number },
    timezone: string
  ): string[] {
    const slots: string[] = [];
    const startDateTime = DateTime.fromJSDate(date)
      .setZone(timezone)
      .set({ hour: parseInt(workingHours.start.split(':')[0]), minute: parseInt(workingHours.start.split(':')[1]) });
    
    const endDateTime = DateTime.fromJSDate(date)
      .setZone(timezone)
      .set({ hour: parseInt(workingHours.end.split(':')[0]), minute: parseInt(workingHours.end.split(':')[1]) });
    
    let currentSlot = startDateTime;
    
    while (currentSlot.plus({ minutes: duration }) <= endDateTime) {
      const slotEnd = currentSlot.plus({ minutes: duration });
      
      // Apply buffer times
      const effectiveStart = currentSlot.minus({ minutes: bufferTime.before });
      const effectiveEnd = slotEnd.plus({ minutes: bufferTime.after });
      
      slots.push(currentSlot.toFormat('HH:mm'));
      currentSlot = currentSlot.plus({ minutes: duration });
    }
    
    return slots;
  }

  /**
   * Get booking window date range
   */
  static getBookingWindow(
    currentDate: DateTime,
    bookingWindowDays: number,
    timezone: string
  ): { startDate: DateTime; endDate: DateTime } {
    const nowInTz = currentDate.setZone(timezone);
    const startDate = nowInTz.startOf('day');
    const endDate = nowInTz.plus({ days: bookingWindowDays }).endOf('day');
    
    return { startDate, endDate };
  }

  /**
   * Validate if a booking date is within allowed window
   */
  static isWithinBookingWindow(
    bookingDate: Date,
    bookingWindowDays: number,
    timezone: string
  ): boolean {
    const now = DateTime.now().setZone(timezone);
    const bookingDateTime = DateTime.fromJSDate(bookingDate).setZone(timezone);
    const maxDate = now.plus({ days: bookingWindowDays });
    
    return bookingDateTime >= now.startOf('day') && bookingDateTime <= maxDate.endOf('day');
  }

  /**
   * Calculate next available working day
   */
  static getNextWorkingDay(
    fromDate: DateTime,
    workingDays: number[],
    timezone: string
  ): DateTime {
    let nextDay = fromDate.setZone(timezone).plus({ days: 1 });
    
    while (!this.isWorkingDay(nextDay, workingDays, timezone)) {
      nextDay = nextDay.plus({ days: 1 });
    }
    
    return nextDay;
  }

  /**
   * Format date for display in organization's timezone
   */
  static formatDateTime(
    date: Date | string,
    timezone: string,
    format: string = 'yyyy-MM-dd HH:mm:ss'
  ): string {
    return DateTime.fromJSDate(new Date(date))
      .setZone(timezone)
      .toFormat(format);
  }

  /**
   * Get all working days in a date range
   */
  static getWorkingDaysInRange(
    startDate: DateTime,
    endDate: DateTime,
    workingDays: number[],
    timezone: string
  ): DateTime[] {
    const workingDaysList: DateTime[] = [];
    let currentDate = startDate.setZone(timezone).startOf('day');
    const end = endDate.setZone(timezone).endOf('day');
    
    while (currentDate <= end) {
      if (this.isWorkingDay(currentDate, workingDays, timezone)) {
        workingDaysList.push(currentDate);
      }
      currentDate = currentDate.plus({ days: 1 });
    }
    
    return workingDaysList;
  }
}