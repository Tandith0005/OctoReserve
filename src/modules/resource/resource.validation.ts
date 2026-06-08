import { z } from 'zod';
import { ResourceType } from '../../types/index.js';

const bufferTimeSchema = z.object({
  before: z.number().min(0).max(120).default(0),
  after: z.number().min(0).max(120).default(0),
}).optional();

export const createResourceSchema = z.object({
  name: z.string()
    .min(2, 'Resource name must be at least 2 characters')
    .max(100, 'Resource name must not exceed 100 characters')
    .trim(),
  
  type: z.enum([ResourceType.MEETING_ROOM, ResourceType.DESK, ResourceType.DEVICE, ResourceType.OTHER]),
  
  capacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(100, 'Capacity must not exceed 100')
    .optional(),
  
  location: z.string()
    .max(200, 'Location must not exceed 200 characters')
    .optional(),
  
  amenities: z.array(z.string().max(50))
    .max(20, 'Maximum 20 amenities allowed')
    .optional(),
  
  bufferTime: bufferTimeSchema,
});

export const updateResourceSchema = z.object({
  name: z.string()
    .min(2, 'Resource name must be at least 2 characters')
    .max(100, 'Resource name must not exceed 100 characters')
    .trim()
    .optional(),
  
  type: z.enum([ResourceType.MEETING_ROOM, ResourceType.DESK, ResourceType.DEVICE, ResourceType.OTHER])
    .optional(),
  
  capacity: z.number()
    .min(1, 'Capacity must be at least 1')
    .max(100, 'Capacity must not exceed 100')
    .optional(),
  
  location: z.string()
    .max(200, 'Location must not exceed 200 characters')
    .optional(),
  
  amenities: z.array(z.string().max(50))
    .max(20, 'Maximum 20 amenities allowed')
    .optional(),
  
  bufferTime: bufferTimeSchema,
  
  isActive: z.boolean().optional(),
});

export const resourceIdParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource ID'),
});

export const resourceFiltersSchema = z.object({
  type: z.enum([ResourceType.MEETING_ROOM, ResourceType.DESK, ResourceType.DEVICE, ResourceType.OTHER]).optional(),
  isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});