import { z } from 'zod';

export const getAvailableSlotsSchema = z.object({
  resourceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must not exceed 480 minutes (8 hours)'),
  timezone: z.string().optional(),
});

export const batchAvailabilitySchema = z.object({
  resourceIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/))
    .min(1, 'At least one resource ID is required')
    .max(10, 'Maximum 10 resources at once'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  duration: z.number().min(15).max(480),
  timezone: z.string().optional(),
});