// src/modules/resource/resource.service.ts
import { Resource } from '../../models/Resource.model.js';
import { Organization } from '../../models/Organization.model.js';
import { User } from '../../models/User.model.js';
import AppError from '../../utils/appError.js';
import { ICreateResource, IUpdateResource, IResourceResponse, IResourceFilters } from './resource.types.js';
import { UserRole, ResourceType } from '../../types/index.js';
import { Types } from 'mongoose';

const createResource = async (
  data: ICreateResource,
  userId: string,
  organizationId: string
): Promise<IResourceResponse> => {
  // Check if user has permission (ORG_ADMIN only)
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user || user.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Only ORG_ADMIN can create resources', 403);
  }

  // Check if organization exists and is active
  const organization = await Organization.findById(organizationId);
  if (!organization || !organization.isActive) {
    throw new AppError('Organization not found or inactive', 404);
  }

  // Check if resource with same name exists in the organization
  const existingResource = await Resource.findOne({
    name: data.name,
    organizationId,
    isDeleted: false,
  });

  if (existingResource) {
    throw new AppError(`Resource with name '${data.name}' already exists in this organization`, 409);
  }

  // Create resource
  const resource = await Resource.create({
    ...data,
    organizationId,
    isActive: true,
    isDeleted: false,
  });

  return formatResourceResponse(resource);
};

const getResourceById = async (
  resourceId: string,
  organizationId: string
): Promise<IResourceResponse> => {
  const resource = await Resource.findOne({
    _id: resourceId,
    organizationId,
    isDeleted: false,
  });

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  return formatResourceResponse(resource);
};

const updateResource = async (
  resourceId: string,
  data: IUpdateResource,
  userId: string,
  organizationId: string
): Promise<IResourceResponse> => {
  // Check permission
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user || user.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Only ORG_ADMIN can update resources', 403);
  }

  // Find resource
  const resource = await Resource.findOne({
    _id: resourceId,
    organizationId,
    isDeleted: false,
  });

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  // Check name uniqueness if name is being updated
  if (data.name && data.name !== resource.name) {
    const existingResource = await Resource.findOne({
      name: data.name,
      organizationId,
      isDeleted: false,
      _id: { $ne: resourceId },
    });

    if (existingResource) {
      throw new AppError(`Resource with name '${data.name}' already exists`, 409);
    }
  }

  // Update fields
  if (data.name) resource.name = data.name;
  if (data.type) resource.type = data.type;
  if (data.capacity !== undefined) resource.capacity = data.capacity;
  if (data.location !== undefined) resource.location = data.location;
  if (data.amenities) resource.amenities = data.amenities;
  if (data.isActive !== undefined) resource.isActive = data.isActive;
  
  if (data.bufferTime) {
    if (data.bufferTime.before !== undefined) resource.bufferTime!.before = data.bufferTime.before;
    if (data.bufferTime.after !== undefined) resource.bufferTime!.after = data.bufferTime.after;
  }

  await resource.save();
  return formatResourceResponse(resource);
};

const deleteResource = async (
  resourceId: string,
  userId: string,
  organizationId: string
): Promise<void> => {
  // Check permission
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user || user.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Only ORG_ADMIN can delete resources', 403);
  }

  // Find resource
  const resource = await Resource.findOne({
    _id: resourceId,
    organizationId,
    isDeleted: false,
  });

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  // Soft delete
  await resource.softDelete();
};

const getAllResources = async (
  organizationId: string,
  filters: IResourceFilters,
  userId: string
): Promise<{ resources: IResourceResponse[]; total: number; page: number; limit: number }> => {
  // Verify user belongs to organization
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user) {
    throw new AppError('Access denied', 403);
  }

  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 10, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Build query
  const query: any = {
    organizationId,
    isDeleted: false,
  };

  if (filters.type) query.type = filters.type;
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { location: { $regex: filters.search, $options: 'i' } },
    ];
  }

  // Execute queries in parallel
  const [resources, total] = await Promise.all([
    Resource.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Resource.countDocuments(query),
  ]);

  return {
    resources: resources.map(formatResourceResponse),
    total,
    page,
    limit,
  };
};

const getResourceTypes = async (organizationId: string): Promise<{ type: string; count: number }[]> => {
  const types = await Resource.aggregate([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);

  return types;
};

const getResourceAvailabilitySettings = async (
  resourceId: string,
  organizationId: string
): Promise<{
  resource: IResourceResponse;
  organizationBufferTime: { before: number; after: number };
  workingHours: any;
}> => {
  const [resource, organization] = await Promise.all([
    Resource.findOne({ _id: resourceId, organizationId, isDeleted: false }),
    Organization.findById(organizationId),
  ]);

  if (!resource) {
    throw new AppError('Resource not found', 404);
  }

  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  return {
    resource: formatResourceResponse(resource),
    organizationBufferTime: organization.bookingConfig.bufferTime,
    workingHours: organization.bookingConfig.workingHours,
  };
};

const formatResourceResponse = (resource: any): IResourceResponse => ({
  id: resource._id.toString(),
  name: resource.name,
  type: resource.type,
  organizationId: resource.organizationId.toString(),
  capacity: resource.capacity,
  location: resource.location,
  amenities: resource.amenities,
  bufferTime: resource.bufferTime,
  isActive: resource.isActive,
  isDeleted: resource.isDeleted,
  createdAt: resource.createdAt,
  updatedAt: resource.updatedAt,
});

export const ResourceService = {
  createResource,
  getResourceById,
  updateResource,
  deleteResource,
  getAllResources,
  getResourceTypes,
  getResourceAvailabilitySettings,
};