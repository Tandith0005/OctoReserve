import { Types } from "mongoose";

/**
 * Ensures tenant isolation in all queries
 */
export const tenantFilter = (organizationId: string | Types.ObjectId) => ({
  organizationId: new Types.ObjectId(organizationId.toString()),
});

/**
 * Adds tenant isolation to aggregation pipelines
 */
export const addTenantPipeline = (organizationId: string | Types.ObjectId) => [
  { $match: { organizationId: new Types.ObjectId(organizationId.toString()) } },
];

/**
 * Soft delete filter
 */
export const activeOnlyFilter = { isDeleted: false, isActive: true };

/**
 * Time range filter for bookings
 */
export const timeRangeFilter = (startTime: Date, endTime: Date) => ({
  startTime: { $gte: startTime },
  endTime: { $lte: endTime },
});

/**
 * Booking conflict query
 */
export const getConflictQuery = (
  resourceId: string | Types.ObjectId,
  startTime: Date,
  endTime: Date,
  status: string = "CONFIRMED",
) => ({
  resourceId: new Types.ObjectId(resourceId.toString()),
  status,
  $or: [
    { startTime: { $lt: endTime, $gte: startTime } },
    { endTime: { $gt: startTime, $lte: endTime } },
    { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
  ],
});
