import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { BookingService } from './booking.service.js';
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  bookingIdParamsSchema,
  bookingFiltersSchema,
} from './booking.validation.js';

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const validatedData = createBookingSchema.parse(req.body);
  const result = await BookingService.createBooking(
    validatedData,
    req.user!.userId,
    req.user!.organizationId
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Booking created successfully',
    data: result,
  });
});

const getBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = bookingIdParamsSchema.parse(req.params);
  const result = await BookingService.getBookingById(
    id,
    req.user!.organizationId,
    req.user!.userId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking fetched successfully',
    data: result,
  });
});

const updateBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = bookingIdParamsSchema.parse(req.params);
  const validatedData = updateBookingSchema.parse(req.body);
  const result = await BookingService.updateBooking(
    id,
    validatedData,
    req.user!.userId,
    req.user!.organizationId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking updated successfully',
    data: result,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = bookingIdParamsSchema.parse(req.params);
  const validatedData = cancelBookingSchema.parse(req.body);
  const result = await BookingService.cancelBooking(
    id,
    validatedData,
    req.user!.userId,
    req.user!.organizationId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Booking cancelled successfully',
    data: result,
  });
});

const getUserBookings = catchAsync(async (req: Request, res: Response) => {
  const filters = bookingFiltersSchema.parse(req.query);
  const result = await BookingService.getUserBookings(
    req.user!.userId,
    req.user!.organizationId,
    filters
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User bookings fetched successfully',
    data: result.bookings,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
});

const getResourceBookings = catchAsync(async (req: Request, res: Response) => {
  const { resourceId } = req.params;
  const filters = bookingFiltersSchema.parse(req.query);
  const result = await BookingService.getResourceBookings(
    resourceId as string,
    req.user!.organizationId,
    filters
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Resource bookings fetched successfully',
    data: result.bookings,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
});

const getAllOrganizationBookings = catchAsync(async (req: Request, res: Response) => {
  const filters = bookingFiltersSchema.parse(req.query);
  const result = await BookingService.getAllOrganizationBookings(
    req.user!.organizationId,
    req.user!.userId,
    filters
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Organization bookings fetched successfully',
    data: result.bookings,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
});

export const BookingController = {
  createBooking,
  getBooking,
  updateBooking,
  cancelBooking,
  getUserBookings,
  getResourceBookings,
  getAllOrganizationBookings,
};