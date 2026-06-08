import { Types } from 'mongoose';

export interface IOrganizationConfig {
  defaultDuration: number;
  maxDuration: number;
  minDuration: number;
  bookingWindowDays: number;
  workingHours: {
    start: string;
    end: string;
    workingDays: number[];
  };
  bufferTime: {
    before: number;
    after: number;
  };
}

export interface ICreateOrganization {
  name: string;
  timezone?: string;
  bookingConfig?: Partial<IOrganizationConfig>;
}

export interface IUpdateOrganization {
  name?: string;
  timezone?: string;
  bookingConfig?: Partial<IOrganizationConfig>;
  isActive?: boolean;
}

export interface IOrganizationResponse {
  id: string;
  name: string;
  timezone: string;
  bookingConfig: IOrganizationConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}