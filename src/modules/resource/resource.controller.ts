// src/modules/resource/resource.controller.ts
import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ResourceService } from './resource.service.js';
import {
  createResourceSchema,
  updateResourceSchema,
  resourceIdParamsSchema,
  resourceFiltersSchema,
} from './resource.validation.js';

const createResource = catchAsync(async (req: Request, res: Response) => {
  const validatedData = createResourceSchema.parse(req.body);
  const result = await ResourceService.createResource(
    validatedData,
    req.user!.userId,
    req.user!.organizationId
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Resource created successfully',
    data: result,
  });
});

const getResource = catchAsync(async (req: Request, res: Response) => {
  const { id } = resourceIdParamsSchema.parse(req.params);
  const result = await ResourceService.getResourceById(id, req.user!.organizationId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Resource fetched successfully',
    data: result,
  });
});

const updateResource = catchAsync(async (req: Request, res: Response) => {
  const { id } = resourceIdParamsSchema.parse(req.params);
  const validatedData = updateResourceSchema.parse(req.body);
  const result = await ResourceService.updateResource(
    id,
    validatedData,
    req.user!.userId,
    req.user!.organizationId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Resource updated successfully',
    data: result,
  });
});

const deleteResource = catchAsync(async (req: Request, res: Response) => {
  const { id } = resourceIdParamsSchema.parse(req.params);
  await ResourceService.deleteResource(id, req.user!.userId, req.user!.organizationId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Resource deleted successfully',
    data: null,
  });
});

const getAllResources = catchAsync(async (req: Request, res: Response) => {
  const filters = resourceFiltersSchema.parse(req.query);
  const result = await ResourceService.getAllResources(
    req.user!.organizationId,
    filters,
    req.user!.userId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Resources fetched successfully',
    data: result.resources,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
});

const getResourceTypes = catchAsync(async (req: Request, res: Response) => {
  const result = await ResourceService.getResourceTypes(req.user!.organizationId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Resource types fetched successfully',
    data: result,
  });
});

const getResourceAvailabilitySettings = catchAsync(async (req: Request, res: Response) => {
  const { id } = resourceIdParamsSchema.parse(req.params);
  const result = await ResourceService.getResourceAvailabilitySettings(
    id,
    req.user!.organizationId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Resource availability settings fetched successfully',
    data: result,
  });
});

export const ResourceController = {
  createResource,
  getResource,
  updateResource,
  deleteResource,
  getAllResources,
  getResourceTypes,
  getResourceAvailabilitySettings,
};