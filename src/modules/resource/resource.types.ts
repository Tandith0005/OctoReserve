// src/modules/resource/resource.types.ts
import { Types } from 'mongoose';
import { ResourceType } from '../../types/index.js';

export interface ICreateResource {
  name: string;
  type: ResourceType;
  capacity?: number;
  location?: string;
  amenities?: string[];
  bufferTime?: {
    before: number;
    after: number;
  };
}

export interface IUpdateResource {
  name?: string;
  type?: ResourceType;
  capacity?: number;
  location?: string;
  amenities?: string[];
  bufferTime?: {
    before: number;
    after: number;
  };
  isActive?: boolean;
}

export interface IResourceResponse {
  id: string;
  name: string;
  type: ResourceType;
  organizationId: string;
  capacity?: number;
  location?: string;
  amenities?: string[];
  bufferTime?: {
    before: number;
    after: number;
  };
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResourceFilters {
  type?: ResourceType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}