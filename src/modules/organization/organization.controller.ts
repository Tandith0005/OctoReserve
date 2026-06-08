import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { OrganizationService } from './organization.service.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationParamsSchema,
} from './organization.validation.js';

const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const validatedData = createOrganizationSchema.parse(req.body);
  const result = await OrganizationService.createOrganization(
    validatedData,
    req.user!.userId
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Organization created successfully',
    data: result,
  });
});

const getOrganization = catchAsync(async (req: Request, res: Response) => {
  const { id } = getOrganizationParamsSchema.parse(req.params);
  const result = await OrganizationService.getOrganizationById(id, req.user!.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Organization fetched successfully',
    data: result,
  });
});

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const { id } = getOrganizationParamsSchema.parse(req.params);
  const validatedData = updateOrganizationSchema.parse(req.body);
  const result = await OrganizationService.updateOrganization(id, validatedData, req.user!.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Organization updated successfully',
    data: result,
  });
});

const getAllOrganizations = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await OrganizationService.getAllOrganizations(req.user!.userId, page, limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Organizations fetched successfully',
    data: result.organizations,
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  });
});

const getSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.getOrganizationSettings(
    req.user!.organizationId,
    req.user!.userId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Organization settings fetched successfully',
    data: result,
  });
});

export const OrganizationController = {
  createOrganization,
  getOrganization,
  updateOrganization,
  getAllOrganizations,
  getSettings,
};