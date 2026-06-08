import { Types } from 'mongoose';
import { UserRole } from '../../types/index.js';

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  organizationId?: string; // Optional for first admin creation
  role?: UserRole;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    organizationId: string;
  };
  token: string;
  refreshToken?: string;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

