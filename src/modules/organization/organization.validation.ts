// src/modules/organization/organization.validation.ts
import { z } from 'zod';

const workingHoursSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  workingDays: z.array(z.number().min(0).max(6)),
});

const bufferTimeSchema = z.object({
  before: z.number().min(0).max(120),
  after: z.number().min(0).max(120),
});

const bookingConfigSchema = z.object({
  defaultDuration: z.number().min(15).max(480),
  maxDuration: z.number().min(15).max(720),
  minDuration: z.number().min(15).max(480),
  bookingWindowDays: z.number().min(1).max(365),
  workingHours: workingHoursSchema,
  bufferTime: bufferTimeSchema,
});

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  timezone: z.string().min(1).default('UTC'),
  bookingConfig: bookingConfigSchema.partial().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  timezone: z.string().min(1).optional(),
  bookingConfig: bookingConfigSchema.partial().optional(),
  isActive: z.boolean().optional(),
});

export const getOrganizationParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID'),
});