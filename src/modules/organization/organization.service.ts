import { Organization } from '../../models/Organization.model.js';
import { User } from '../../models/User.model.js';
import AppError from '../../utils/appError.js';
import { ICreateOrganization, IUpdateOrganization, IOrganizationResponse } from './organization.types.js';
import { UserRole } from '../../types/index.js';

const createOrganization = async (
  data: ICreateOrganization,
  adminUserId: string
): Promise<IOrganizationResponse> => {
  // Check if user is ORG_ADMIN
  const admin = await User.findById(adminUserId);
  if (!admin || admin.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Only ORG_ADMIN can create organizations', 403);
  }

  // Check if organization with same name exists
  const existingOrg = await Organization.findOne({ name: data.name });
  if (existingOrg) {
    throw new AppError('Organization with this name already exists', 409);
  }

  // Set default booking config
  const defaultBookingConfig = {
    defaultDuration: 60,
    maxDuration: 480,
    minDuration: 15,
    bookingWindowDays: 30,
    workingHours: {
      start: '09:00',
      end: '17:00',
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    },
    bufferTime: {
      before: 0,
      after: 0,
    },
  };

  // Merge provided config with defaults
  const bookingConfig = {
    ...defaultBookingConfig,
    ...data.bookingConfig,
    workingHours: {
      ...defaultBookingConfig.workingHours,
      ...data.bookingConfig?.workingHours,
    },
    bufferTime: {
      ...defaultBookingConfig.bufferTime,
      ...data.bookingConfig?.bufferTime,
    },
  };

  const organization = await Organization.create({
    name: data.name,
    timezone: data.timezone || 'UTC',
    bookingConfig,
    isActive: true,
  });

  return formatOrganizationResponse(organization);
};

const getOrganizationById = async (
  organizationId: string,
  userId: string
): Promise<IOrganizationResponse> => {
  // Check if user belongs to this organization
  const user = await User.findById(userId);
  if (!user || user.organizationId.toString() !== organizationId) {
    throw new AppError('Access denied', 403);
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  return formatOrganizationResponse(organization);
};

const updateOrganization = async (
  organizationId: string,
  data: IUpdateOrganization,
  userId: string
): Promise<IOrganizationResponse> => {
  // Check if user is ORG_ADMIN of this organization
  const user = await User.findOne({
    _id: userId,
    organizationId,
    role: UserRole.ORG_ADMIN,
  });
  
  if (!user) {
    throw new AppError('Only ORG_ADMIN can update organization settings', 403);
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // Update fields
  if (data.name) organization.name = data.name;
  if (data.timezone) organization.timezone = data.timezone;
  if (data.isActive !== undefined) organization.isActive = data.isActive;
  
  if (data.bookingConfig) {
    if (data.bookingConfig.defaultDuration) organization.bookingConfig.defaultDuration = data.bookingConfig.defaultDuration;
    if (data.bookingConfig.maxDuration) organization.bookingConfig.maxDuration = data.bookingConfig.maxDuration;
    if (data.bookingConfig.minDuration) organization.bookingConfig.minDuration = data.bookingConfig.minDuration;
    if (data.bookingConfig.bookingWindowDays) organization.bookingConfig.bookingWindowDays = data.bookingConfig.bookingWindowDays;
    
    if (data.bookingConfig.workingHours) {
      if (data.bookingConfig.workingHours.start) organization.bookingConfig.workingHours.start = data.bookingConfig.workingHours.start;
      if (data.bookingConfig.workingHours.end) organization.bookingConfig.workingHours.end = data.bookingConfig.workingHours.end;
      if (data.bookingConfig.workingHours.workingDays) organization.bookingConfig.workingHours.workingDays = data.bookingConfig.workingHours.workingDays;
    }
    
    if (data.bookingConfig.bufferTime) {
      if (data.bookingConfig.bufferTime.before !== undefined) organization.bookingConfig.bufferTime.before = data.bookingConfig.bufferTime.before;
      if (data.bookingConfig.bufferTime.after !== undefined) organization.bookingConfig.bufferTime.after = data.bookingConfig.bufferTime.after;
    }
  }

  await organization.save();
  return formatOrganizationResponse(organization);
};

const getAllOrganizations = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ organizations: IOrganizationResponse[]; total: number }> => {
  // Check if user is ORG_ADMIN
  const user = await User.findById(userId);
  if (!user || user.role !== UserRole.ORG_ADMIN) {
    throw new AppError('Only ORG_ADMIN can view all organizations', 403);
  }

  const skip = (page - 1) * limit;
  
  const [organizations, total] = await Promise.all([
    Organization.find({ isDeleted: false })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Organization.countDocuments({ isDeleted: false }),
  ]);

  return {
    organizations: organizations.map(formatOrganizationResponse),
    total,
  };
};

const getOrganizationSettings = async (
  organizationId: string,
  userId: string
): Promise<IOrganizationResponse> => {
  // Any authenticated user from the organization can view settings
  const user = await User.findOne({
    _id: userId,
    organizationId,
  });
  
  if (!user) {
    throw new AppError('Access denied', 403);
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  return formatOrganizationResponse(organization);
};

const formatOrganizationResponse = (org: any): IOrganizationResponse => ({
  id: org._id.toString(),
  name: org.name,
  timezone: org.timezone,
  bookingConfig: org.bookingConfig,
  isActive: org.isActive,
  createdAt: org.createdAt,
  updatedAt: org.updatedAt,
});

export const OrganizationService = {
  createOrganization,
  getOrganizationById,
  updateOrganization,
  getAllOrganizations,
  getOrganizationSettings,
};