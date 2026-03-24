import { JWTPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      adminUser?: JWTPayload;
      user?: JWTPayload;
    }
  }
}

export {};
