import { IJwtPayload } from '../path/to/auth.types';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: IJwtPayload;
//     }
//   }
// }

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        organizationId: string;
      };
    }
  }
}

export {};