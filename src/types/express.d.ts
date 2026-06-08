import { IJwtPayload } from '../path/to/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}

export {};