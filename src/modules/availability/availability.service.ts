import { Resource } from '../../models/Resource.model.js';
import { Organization } from '../../models/Organization.model.js';
import { User } from '../../models/User.model.js';
import AppError from '../../utils/appError.js';
import { AvailabilityEngine } from './availability.engine.js';
import { IGetAvailableSlots, IAvailabilityResponse } from './availability.types.js';
import { DateTime } from 'luxon';

const getAvailableSlots = async (
  params: IGetAvailableSlots,
  userId: string,
  organizationId: string
): Promise<IAvailabilityResponse> => {
  // Verify user belongs to organization
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user) {
    throw new AppError('Access denied', 403);
  }
  
  // Get resource
  const resource = await Resource.findOne({
    _id: params.resourceId,
    organizationId,
    isDeleted: false,
    isActive: true,
  });
  
  if (!resource) {
    throw new AppError('Resource not found or unavailable', 404);
  }
  
  // Get organization settings
  const organization = await Organization.findById(organizationId);
  if (!organization || !organization.isActive) {
    throw new AppError('Organization not found or inactive', 404);
  }
  
  const { bookingConfig, timezone } = organization;
  
  // Use provided timezone or organization timezone
  const timezoneToUse = params.timezone || timezone;
  
  // Validate timezone
  if (!DateTime.local().setZone(timezoneToUse).isValid) {
    throw new AppError('Invalid timezone', 400);
  }
  
  // Get buffer times (resource takes precedence over organization)
  const bufferBefore = resource.bufferTime?.before ?? bookingConfig.bufferTime.before;
  const bufferAfter = resource.bufferTime?.after ?? bookingConfig.bufferTime.after;
  
  // Create availability engine instance
  const engine = new AvailabilityEngine(
    params.resourceId,
    organizationId,
    params.date,
    params.duration,
    timezoneToUse,
    bookingConfig.workingHours,
    bufferBefore,
    bufferAfter,
    bookingConfig.bookingWindowDays,
    bookingConfig.minDuration,
    bookingConfig.maxDuration
  );
  
  // Generate available slots
  const availableSlots = await engine.generateAvailableSlots();
  const totalAvailable = availableSlots.filter(slot => slot.isAvailable).length;
  
  return {
    resourceId: resource._id.toString(),
    resourceName: resource.name,
    date: params.date,
    timezone: timezoneToUse,
    workingHours: {
      start: bookingConfig.workingHours.start,
      end: bookingConfig.workingHours.end,
    },
    duration: params.duration,
    availableSlots,
    totalAvailable,
    metadata: {
      bufferTimeApplied: {
        before: bufferBefore,
        after: bufferAfter,
      },
      workingHoursRespected: true,
      bookingWindowRespected: true,
    },
  };
};

const getBatchAvailability = async (
  resourceIds: string[],
  date: string,
  duration: number,
  userId: string,
  organizationId: string,
  timezone?: string
): Promise<any[]> => {
  // Verify user belongs to organization
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user) {
    throw new AppError('Access denied', 403);
  }
  
  // Get organization settings once
  const organization = await Organization.findById(organizationId);
  if (!organization || !organization.isActive) {
    throw new AppError('Organization not found or inactive', 404);
  }
  
  const results = [];
  
  for (const resourceId of resourceIds) {
    try {
      const availability = await getAvailableSlots(
        { resourceId, date, duration, timezone },
        userId,
        organizationId
      );
      results.push(availability);
    } catch (error) {
      // If resource not found, skip it
      if (error instanceof AppError && error.message.includes('not found')) {
        continue;
      }
      throw error;
    }
  }
  
  return results;
};

const getDailyAvailability = async (
  resourceId: string,
  startDate: string,
  endDate: string,
  duration: number,
  userId: string,
  organizationId: string,
  timezone?: string
): Promise<any[]> => {
  // Verify user belongs to organization
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user) {
    throw new AppError('Access denied', 403);
  }
  
  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  
  if (!start.isValid || !end.isValid || end < start) {
    throw new AppError('Invalid date range', 400);
  }
  
  const days = [];
  let current = start;
  
  while (current <= end) {
    const dateStr = current.toFormat('yyyy-MM-dd');
    const availability = await getAvailableSlots(
      { resourceId, date: dateStr, duration, timezone },
      userId,
      organizationId
    );
    days.push(availability);
    current = current.plus({ days: 1 });
  }
  
  return days;
};

export const AvailabilityService = {
  getAvailableSlots,
  getBatchAvailability,
  getDailyAvailability,
};