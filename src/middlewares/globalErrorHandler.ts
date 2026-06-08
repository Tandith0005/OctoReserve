import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import AppError from "../utils/appError.js";
import { MongooseError } from "mongoose";
import { logger } from "../utils/logger.js";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errorDetails = undefined;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;

    return res.status(statusCode).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Zod errors
  else if (err instanceof ZodError || err.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";

    errorDetails = err.issues.map((e: any) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(statusCode).json({
      success: false,
      message,
      errors: errorDetails,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Handle Mongoose/MongoDB errors
  else if (err instanceof MongooseError) {
    // CastError - Invalid ObjectId
    if (err.name === "CastError") {
      const castError = err as any;

      statusCode = 400;
      message = `Invalid ${castError.path}: ${castError.value}`;
    }
    // ValidationError
    else if (err.name === "ValidationError") {
      statusCode = 400;
      message = "Database validation failed";
      errorDetails = Object.values((err as any).errors).map((e: any) => ({
        field: e.path,
        message: e.message,
      }));
    }
    // Other Mongoose errors
    else {
      statusCode = 400;
      message = err.message;
    }
  }

  // Handle MongoDB duplicate key error (code 11000)
  else if ((err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyPattern)[0];
    message = `Duplicate value for ${field}. This ${field} already exists.`;
    errorDetails = {
      field,
      value: (err as any).keyValue[field],
    };
  }

  // JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Handle booking conflict errors
  else if (err.name === "BookingConflictError") {
    statusCode = 409;
    message = err.message;
    errorDetails = {
      conflictingBooking: err.conflictingBooking,
      requestedTimeSlot: err.requestedTimeSlot,
    };
  }

  // Handle availability errors
  else if (err.name === "AvailabilityError") {
    statusCode = 400;
    message = err.message;
    errorDetails = {
      requestedDuration: err.requestedDuration,
      availableSlots: err.availableSlots,
    };
  }

  // Handle organization isolation errors
  else if (err.name === "TenantIsolationError") {
    statusCode = 403;
    message =
      "Access denied: You don't have permission to access this resource";
  }

  // Handle timezone errors
  else if (err.name === "TimezoneError") {
    statusCode = 400;
    message = `Invalid timezone configuration: ${err.message}`;
  }

  // Handle working hours violations
  else if (err.name === "WorkingHoursViolationError") {
    statusCode = 400;
    message = err.message;
    errorDetails = {
      workingHours: err.workingHours,
      requestedTime: err.requestedTime,
    };
  }

  // Handle buffer time violations
  else if (err.name === "BufferTimeViolationError") {
    statusCode = 400;
    message = err.message;
    errorDetails = {
      requiredBufferMinutes: err.requiredBufferMinutes,
      nearestAvailableTime: err.nearestAvailableTime,
    };
  }

  // Default error for any other cases
  if (!statusCode || statusCode === 500) {
    logger.error("Unhandled error:", err);
    message =
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorDetails && { details: errorDetails }),
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
