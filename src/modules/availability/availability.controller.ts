import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AvailabilityService } from './availability.service.js';
import {
  getAvailableSlotsSchema,
  batchAvailabilitySchema,
} from './availability.validation.js';

const getAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const validatedData = getAvailableSlotsSchema.parse({
    ...req.query,
    duration: parseInt(req.query.duration as string),
  });
  
  const result = await AvailabilityService.getAvailableSlots(
    validatedData,
    req.user!.userId,
    req.user!.organizationId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Available slots fetched successfully',
    data: result,
  });
});

const getBatchAvailability = catchAsync(async (req: Request, res: Response) => {
  const validatedData = batchAvailabilitySchema.parse({
    ...req.body,
    duration: req.body.duration,
  });
  
  const result = await AvailabilityService.getBatchAvailability(
    validatedData.resourceIds,
    validatedData.date,
    validatedData.duration,
    req.user!.userId,
    req.user!.organizationId,
    validatedData.timezone
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Batch availability fetched successfully',
    data: result,
  });
});

const getDailyAvailability = catchAsync(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  const { startDate, endDate, duration, timezone } = req.query;
  
  const result = await AvailabilityService.getDailyAvailability(
    resourceId as string,
    startDate as string,
    endDate as string,
    parseInt(duration as string),
    req.user!.userId,
    req.user!.organizationId,
    timezone as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Daily availability fetched successfully',
    data: result,
  });
});

export const AvailabilityController = {
  getAvailableSlots,
  getBatchAvailability,
  getDailyAvailability,
};