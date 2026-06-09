import { Booking } from '../../models/Booking.model.js';
import { Resource } from '../../models/Resource.model.js';
import { Organization } from '../../models/Organization.model.js';
import { User } from '../../models/User.model.js';
import AppError from '../../utils/appError.js';
import { 
  ICreateBooking, 
  IUpdateBooking, 
  ICancelBooking, 
  IBookingResponse, 
  IBookingFilters 
} from './booking.types.js';
import { BookingStatus, UserRole } from '../../types/index.js';
import { Types } from 'mongoose';
import { 
  validateBookingDuration, 
  validateWorkingHours, 
  validateBookingWindow,
  applyBufferTime 
} from './booking.utils.js';

const createBooking = async (
  data: ICreateBooking,
  userId: string,
  organizationId: string
): Promise<IBookingResponse> => {
  // Get user
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 404);
  }
  
  // Get resource
  const resource = await Resource.findOne({
    _id: data.resourceId,
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
  
  const { bookingConfig } = organization;
  
  // Calculate duration
  const durationMinutes = (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60);
  
  // Validate duration
  const durationValidation = validateBookingDuration(
    data.startTime,
    data.endTime,
    bookingConfig.minDuration,
    bookingConfig.maxDuration
  );
  if (!durationValidation.isValid) {
    throw new AppError(durationValidation.errors!.join(', '), 400);
  }
  
  // Validate working hours
  const workingHoursValidation = validateWorkingHours(
    data.startTime,
    data.endTime,
    bookingConfig.workingHours,
    organization.timezone
  );
  if (!workingHoursValidation.isValid) {
    throw new AppError(workingHoursValidation.errors!.join(', '), 400);
  }
  
  // Validate booking window
  const windowValidation = validateBookingWindow(
    data.startTime,
    bookingConfig.bookingWindowDays
  );
  if (!windowValidation.isValid) {
    throw new AppError(windowValidation.errors!.join(', '), 400);
  }
  
  // Apply buffer times (resource buffer takes precedence over organization buffer)
  const bufferBefore = resource.bufferTime?.before ?? bookingConfig.bufferTime.before;
  const bufferAfter = resource.bufferTime?.after ?? bookingConfig.bufferTime.after;
  
  const { bufferedStart, bufferedEnd } = applyBufferTime(
    data.startTime,
    data.endTime,
    bufferBefore,
    bufferAfter
  );
  
  // Check for conflicts with buffered times
  const conflictQuery = {
    resourceId: resource._id,
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
    $or: [
      { startTime: { $lt: bufferedEnd, $gte: bufferedStart } },
      { endTime: { $gt: bufferedStart, $lte: bufferedEnd } },
      { startTime: { $lte: bufferedStart }, endTime: { $gte: bufferedEnd } }
    ]
  };
  
  const conflictingBooking = await Booking.findOne(conflictQuery);
  if (conflictingBooking) {
    throw new AppError(
      'Time slot conflicts with existing booking (including buffer times)', 
      409
    );
  }
  
  // Create booking
  const booking = await Booking.create({
    resourceId: resource._id,
    organizationId,
    userId: user._id,
    title: data.title,
    description: data.description,
    startTime: data.startTime,
    endTime: data.endTime,
    duration: durationMinutes,
    status: BookingStatus.CONFIRMED,
  });
  
  return await formatBookingResponse(booking);
};

const getBookingById = async (
  bookingId: string,
  organizationId: string,
  userId: string
): Promise<IBookingResponse> => {
  const booking = await Booking.findOne({
    _id: bookingId,
    organizationId,
  }).populate('resourceId', 'name').populate('userId', 'name');
  
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  
  // Check if user has access (own booking or ORG_ADMIN)
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  if (booking.userId.toString() !== userId && user.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Access denied', 403);
  }
  
  return formatBookingResponse(booking);
};

const updateBooking = async (
  bookingId: string,
  data: IUpdateBooking,
  userId: string,
  organizationId: string
): Promise<IBookingResponse> => {
  // Find booking
  const booking = await Booking.findOne({
    _id: bookingId,
    organizationId,
  });
  
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  
  // Check if user can update (own booking or ORG_ADMIN)
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  if (booking.userId.toString() !== userId && user.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Access denied', 403);
  }
  
  // Check if booking is cancelled
  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError('Cannot update cancelled booking', 400);
  }
  
  // Check if booking is in the past
  if (booking.startTime < new Date()) {
    throw new AppError('Cannot update past bookings', 400);
  }
  
  // Prepare update data
  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  
  // If updating times, revalidate everything
  if (data.startTime || data.endTime) {
    const newStartTime = data.startTime || booking.startTime;
    const newEndTime = data.endTime || booking.endTime;
    
    // Get resource and organization
    const resource = await Resource.findById(booking.resourceId);
    const organization = await Organization.findById(organizationId);
    
    if (!resource || !organization) {
      throw new AppError('Resource or organization not found', 404);
    }
    
    const { bookingConfig } = organization;
    
    // Validate duration
    const newDuration = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60);
    const durationValidation = validateBookingDuration(
      newStartTime,
      newEndTime,
      bookingConfig.minDuration,
      bookingConfig.maxDuration
    );
    if (!durationValidation.isValid) {
      throw new AppError(durationValidation.errors!.join(', '), 400);
    }
    
    // Validate working hours
    const workingHoursValidation = validateWorkingHours(
      newStartTime,
      newEndTime,
      bookingConfig.workingHours,
      organization.timezone
    );
    if (!workingHoursValidation.isValid) {
      throw new AppError(workingHoursValidation.errors!.join(', '), 400);
    }
    
    // Validate booking window
    const windowValidation = validateBookingWindow(
      newStartTime,
      bookingConfig.bookingWindowDays
    );
    if (!windowValidation.isValid) {
      throw new AppError(windowValidation.errors!.join(', '), 400);
    }
    
    // Apply buffer times
    const bufferBefore = resource.bufferTime?.before ?? bookingConfig.bufferTime.before;
    const bufferAfter = resource.bufferTime?.after ?? bookingConfig.bufferTime.after;
    const { bufferedStart, bufferedEnd } = applyBufferTime(
      newStartTime,
      newEndTime,
      bufferBefore,
      bufferAfter
    );
    
    // Check for conflicts (excluding current booking)
    const conflictQuery = {
      resourceId: booking.resourceId,
      _id: { $ne: booking._id },
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      $or: [
        { startTime: { $lt: bufferedEnd, $gte: bufferedStart } },
        { endTime: { $gt: bufferedStart, $lte: bufferedEnd } },
        { startTime: { $lte: bufferedStart }, endTime: { $gte: bufferedEnd } }
      ]
    };
    
    const conflictingBooking = await Booking.findOne(conflictQuery);
    if (conflictingBooking) {
      throw new AppError('Updated time slot conflicts with existing booking', 409);
    }
    
    updateData.startTime = newStartTime;
    updateData.endTime = newEndTime;
    updateData.duration = newDuration;
  }
  
  // Update booking
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    updateData,
    { new: true, runValidators: true }
  ).populate('resourceId', 'name').populate('userId', 'name');
  
  if (!updatedBooking) {
    throw new AppError('Failed to update booking', 500);
  }
  
  return formatBookingResponse(updatedBooking);
};

const cancelBooking = async (
  bookingId: string,
  data: ICancelBooking,
  userId: string,
  organizationId: string
): Promise<IBookingResponse> => {
  // Find booking
  const booking = await Booking.findOne({
    _id: bookingId,
    organizationId,
  });
  
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  
  // Check if user can cancel (own booking or ORG_ADMIN)
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  if (booking.userId.toString() !== userId && user.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Access denied', 403);
  }
  
  // Check if booking is already cancelled
  if (booking.status === BookingStatus.CANCELLED) {
    throw new AppError('Booking already cancelled', 400);
  }
  
  // Check if booking is in the past
  if (booking.startTime < new Date()) {
    throw new AppError('Cannot cancel past bookings', 400);
  }
  
  // Cancel booking
  booking.status = BookingStatus.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancelledBy = new Types.ObjectId(userId);
  if (data.cancellationReason) {
    booking.cancellationReason = data.cancellationReason;
  }
  
  await booking.save();
  
  const cancelledBooking = await Booking.findById(bookingId)
    .populate('resourceId', 'name')
    .populate('userId', 'name');
  
  return formatBookingResponse(cancelledBooking!);
};

const getUserBookings = async (
  userId: string,
  organizationId: string,
  filters: IBookingFilters
): Promise<{ bookings: IBookingResponse[]; total: number; page: number; limit: number }> => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 10, 100);
  const skip = (page - 1) * limit;
  
  const query: any = {
    userId,
    organizationId,
  };
  
  if (filters.status) query.status = filters.status;
  if (filters.startDate) query.startTime = { $gte: filters.startDate };
  if (filters.endDate) query.endTime = { $lte: filters.endDate };
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ startTime: -1 })
      .populate('resourceId', 'name'),
    Booking.countDocuments(query),
  ]);
  
  return {
    bookings: bookings.map(b => formatBookingResponse(b)),
    total,
    page,
    limit,
  };
};

const getResourceBookings = async (
  resourceId: string,
  organizationId: string,
  filters: IBookingFilters
): Promise<{ bookings: IBookingResponse[]; total: number; page: number; limit: number }> => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 10, 100);
  const skip = (page - 1) * limit;
  
  const query: any = {
    resourceId,
    organizationId,
  };
  
  if (filters.status) query.status = filters.status;
  if (filters.startDate) query.startTime = { $gte: filters.startDate };
  if (filters.endDate) query.endTime = { $lte: filters.endDate };
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ startTime: -1 })
      .populate('userId', 'name'),
    Booking.countDocuments(query),
  ]);
  
  return {
    bookings: bookings.map(b => formatBookingResponse(b)),
    total,
    page,
    limit,
  };
};

const getAllOrganizationBookings = async (
  organizationId: string,
  userId: string,
  filters: IBookingFilters
): Promise<{ bookings: IBookingResponse[]; total: number; page: number; limit: number }> => {
  // Check if user is ORG_ADMIN
  const user = await User.findById(userId);
  if (!user || user.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Only ORG_ADMIN can view all organization bookings', 403);
  }
  
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 10, 100);
  const skip = (page - 1) * limit;
  
  const query: any = { organizationId };
  if (filters.resourceId) query.resourceId = filters.resourceId;
  if (filters.status) query.status = filters.status;
  if (filters.startDate) query.startTime = { $gte: filters.startDate };
  if (filters.endDate) query.endTime = { $lte: filters.endDate };
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ startTime: -1 })
      .populate('resourceId', 'name')
      .populate('userId', 'name'),
    Booking.countDocuments(query),
  ]);
  
  return {
    bookings: bookings.map(b => formatBookingResponse(b)),
    total,
    page,
    limit,
  };
};

const formatBookingResponse = (booking: any): IBookingResponse => ({
  id: booking._id.toString(),
  resourceId: booking.resourceId._id?.toString() || booking.resourceId.toString(),
  resourceName: booking.resourceId.name,
  organizationId: booking.organizationId.toString(),
  userId: booking.userId._id?.toString() || booking.userId.toString(),
  userName: booking.userId.name,
  title: booking.title,
  description: booking.description,
  startTime: booking.startTime,
  endTime: booking.endTime,
  duration: booking.duration,
  status: booking.status,
  cancelledAt: booking.cancelledAt,
  cancelledBy: booking.cancelledBy?.toString(),
  cancellationReason: booking.cancellationReason,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
});

export const BookingService = {
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  getUserBookings,
  getResourceBookings,
  getAllOrganizationBookings,
};