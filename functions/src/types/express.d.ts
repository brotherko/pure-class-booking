import { PureJwtPayload } from './pure-jwt-payload';

declare module 'express-serve-static-core' {
  export interface Request {
    jwtPayload: PureJwtPayload;
  }
}
