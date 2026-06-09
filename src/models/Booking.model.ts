import mongoose, { Schema } from 'mongoose';
import { IBooking, BookingStatus } from '../types/index.js';
import AppError from '../utils/appError.js';

const BookingSchema = new Schema<IBooking>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: 'CONFIRMED',
      index: true,
    },
    cancelledAt: Date,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// indexes for conflict detection and availability queries
BookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ resourceId: 1, status: 1, startTime: 1 });
BookingSchema.index({ organizationId: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ userId: 1, startTime: 1 });
BookingSchema.index({ status: 1, startTime: 1 });

// Compound index for time-based queries with status filtering
BookingSchema.index({ 
  resourceId: 1, 
  startTime: 1, 
  endTime: 1, 
  status: 1 
});

// Index for checking overlapping bookings efficiently
BookingSchema.index({ 
  resourceId: 1, 
  status: 1,
  startTime: 1,
  endTime: 1 
});

// Pre-save validation
BookingSchema.pre('save', function () {
  // Ensure endTime is after startTime
  if (this.startTime >= this.endTime) {
    throw new AppError('End time must be after start time', 400);
  }

  // Calculate duration if not provided
  if (!this.duration) {
    this.duration = Math.round(
      (this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60)
    );
  }
});

// Method to check if booking is active
BookingSchema.methods.isActive = function(): boolean {
  return this.status === 'CONFIRMED' && this.endTime > new Date();
};

// Static method for conflict checking
BookingSchema.statics.checkConflict = async function(
  resourceId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const query: any = {
    resourceId,
    status: 'CONFIRMED',
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const conflictingBooking = await this.findOne(query);
  return !!conflictingBooking;
};

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);