import { DateTime, Interval } from 'luxon';
import { ITimeSlot, IBlockedSlot, IAvailableSlot } from './availability.types.js';
import { Booking } from '../../models/Booking.model.js';
import { Resource } from '../../models/Resource.model.js';
import { Organization } from '../../models/Organization.model.js';
import { BookingStatus } from '../../types/index.js';
import { Types } from 'mongoose';

export class AvailabilityEngine {
  private resourceId: string;
  private organizationId: string;
  private date: string;
  private duration: number;
  private timezone: string;
  private workingHours: { start: string; end: string; workingDays: number[] };
  private bufferBefore: number;
  private bufferAfter: number;
  private bookingWindowDays: number;
  private minDuration: number;
  private maxDuration: number;

  constructor(
    resourceId: string,
    organizationId: string,
    date: string,
    duration: number,
    timezone: string,
    workingHours: { start: string; end: string; workingDays: number[] },
    bufferBefore: number,
    bufferAfter: number,
    bookingWindowDays: number,
    minDuration: number,
    maxDuration: number
  ) {
    this.resourceId = resourceId;
    this.organizationId = organizationId;
    this.date = date;
    this.duration = duration;
    this.timezone = timezone;
    this.workingHours = workingHours;
    this.bufferBefore = bufferBefore;
    this.bufferAfter = bufferAfter;
    this.bookingWindowDays = bookingWindowDays;
    this.minDuration = minDuration;
    this.maxDuration = maxDuration;
  }

  async generateAvailableSlots(): Promise<IAvailableSlot[]> {
    // Step 1: Generate all possible time slots for the day
    const allSlots = this.generateAllTimeSlots();
    
    // Step 2: Get all blocked slots (bookings + buffers)
    const blockedSlots = await this.getBlockedSlots();
    
    // Step 3: Filter out blocked slots
    const availableSlots = this.filterAvailableSlots(allSlots, blockedSlots);
    
    // Step 4: Apply additional constraints
    const validatedSlots = this.applyConstraints(availableSlots);
    
    return validatedSlots;
  }

  private generateAllTimeSlots(): ITimeSlot[] {
    const slots: ITimeSlot[] = [];
    
    // Parse working hours
    const [workStartHour, workStartMinute] = this.workingHours.start.split(':').map(Number);
    const [workEndHour, workEndMinute] = this.workingHours.end.split(':').map(Number);
    
    // Create start and end of day in the specified timezone
    const startOfDay = DateTime.fromISO(this.date, { zone: this.timezone })
      .set({ hour: workStartHour, minute: workStartMinute, second: 0, millisecond: 0 });
    
    const endOfDay = DateTime.fromISO(this.date, { zone: this.timezone })
      .set({ hour: workEndHour, minute: workEndMinute, second: 0, millisecond: 0 });
    
    // Check if it's a working day
    const dayOfWeek = startOfDay.weekday; // 1-7 where Monday is 1
    const adjustedDay = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert to 0-6 where Sunday is 0
    
    if (!this.workingHours.workingDays.includes(adjustedDay)) {
      return slots; // Return empty array for non-working days
    }
    
    // Generate slots in increments of the requested duration
    let currentStart = startOfDay;
    
    while (currentStart.plus({ minutes: this.duration }) <= endOfDay) {
      const slotEnd = currentStart.plus({ minutes: this.duration });
      
      slots.push({
        start: currentStart.toJSDate(),
        end: slotEnd.toJSDate(),
      });
      
      currentStart = currentStart.plus({ minutes: this.duration });
    }
    
    return slots;
  }

  private async getBlockedSlots(): Promise<IBlockedSlot[]> {
    const blockedSlots: IBlockedSlot[] = [];
    
    // Get date range for the day (considering buffer times)
    const startOfDay = DateTime.fromISO(this.date, { zone: this.timezone })
      .startOf('day')
      .minus({ minutes: this.bufferBefore });
    
    const endOfDay = DateTime.fromISO(this.date, { zone: this.timezone })
      .endOf('day')
      .plus({ minutes: this.bufferAfter });
    
    // Fetch all bookings for this resource on the given day
    const bookings = await Booking.find({
      resourceId: new Types.ObjectId(this.resourceId),
      organizationId: new Types.ObjectId(this.organizationId),
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      startTime: { $lt: endOfDay.toJSDate() },
      endTime: { $gt: startOfDay.toJSDate() },
    }).lean();
    
    // Add booking slots and buffer slots
    for (const booking of bookings) {
      // Add the actual booking slot
      blockedSlots.push({
        start: booking.startTime,
        end: booking.endTime,
        reason: 'booking',
      });
      
      // Add buffer before booking
      if (this.bufferBefore > 0) {
        const bufferStart = new Date(booking.startTime.getTime() - this.bufferBefore * 60 * 1000);
        if (bufferStart < booking.startTime) {
          blockedSlots.push({
            start: bufferStart,
            end: booking.startTime,
            reason: 'buffer',
          });
        }
      }
      
      // Add buffer after booking
      if (this.bufferAfter > 0) {
        const bufferEnd = new Date(booking.endTime.getTime() + this.bufferAfter * 60 * 1000);
        if (bufferEnd > booking.endTime) {
          blockedSlots.push({
            start: booking.endTime,
            end: bufferEnd,
            reason: 'buffer',
          });
        }
      }
    }
    
    // Merge overlapping blocked slots
    return this.mergeOverlappingSlots(blockedSlots);
  }

  private mergeOverlappingSlots(slots: IBlockedSlot[]): IBlockedSlot[] {
    if (slots.length === 0) return [];
    
    // Sort by start time
    const sorted = slots.sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: IBlockedSlot[] = [];
    
    let current = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      
      // Check if slots overlap or touch
      if (next.start <= current.end) {
        // Merge slots
        current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()));
        current.reason = 'booking'; // Prioritize booking reason
      } else {
        merged.push(current);
        current = next;
      }
    }
    
    merged.push(current);
    return merged;
  }

  private filterAvailableSlots(allSlots: ITimeSlot[], blockedSlots: IBlockedSlot[]): IAvailableSlot[] {
    const availableSlots: IAvailableSlot[] = [];
    
    for (const slot of allSlots) {
      let isAvailable = true;
      
      // Check if slot overlaps with any blocked slot
      for (const blocked of blockedSlots) {
        if (this.slotsOverlap(slot, blocked)) {
          isAvailable = false;
          break;
        }
      }
      
      // Convert to local time for display
      const startLocal = DateTime.fromJSDate(slot.start).setZone(this.timezone);
      const endLocal = DateTime.fromJSDate(slot.end).setZone(this.timezone);
      
      availableSlots.push({
        startTime: slot.start,
        endTime: slot.end,
        startTimeLocal: startLocal.toFormat('HH:mm'),
        endTimeLocal: endLocal.toFormat('HH:mm'),
        isAvailable,
      });
    }
    
    return availableSlots;
  }

  private slotsOverlap(slot1: ITimeSlot, slot2: ITimeSlot | IBlockedSlot): boolean {
    // Check if slot1 and slot2 overlap
    const slot1Start = slot1.start.getTime();
    const slot1End = slot1.end.getTime();
    const slot2Start = slot2.start.getTime();
    const slot2End = slot2.end.getTime();
    
    return slot1Start < slot2End && slot1End > slot2Start;
  }

  private applyConstraints(slots: IAvailableSlot[]): IAvailableSlot[] {
    const now = DateTime.now().setZone(this.timezone);
    const maxFutureDate = now.plus({ days: this.bookingWindowDays });
    const selectedDate = DateTime.fromISO(this.date, { zone: this.timezone });
    
    return slots.filter(slot => {
      const slotStart = DateTime.fromJSDate(slot.startTime).setZone(this.timezone);
      
      // Check if slot is in the past
      if (slotStart < now) {
        return false;
      }
      
      // Check if slot is beyond booking window
      if (slotStart > maxFutureDate) {
        return false;
      }
      
      // Check if date is within booking window
      if (selectedDate > maxFutureDate) {
        return false;
      }
      
      // Check if duration is within limits
      const slotDuration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
      if (slotDuration < this.minDuration || slotDuration > this.maxDuration) {
        return false;
      }
      
      return true;
    });
  }
}