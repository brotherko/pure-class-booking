import { JwtPayload } from './pure-jwt-payload';

declare module 'express-serve-static-core' {
  export interface Request {
    jwtPayload: JwtPayload
  }
}