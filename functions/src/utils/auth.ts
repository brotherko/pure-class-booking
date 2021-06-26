import { config } from 'firebase-functions';
import { sign, verify } from 'jsonwebtoken';
import { err, ok, Result } from 'neverthrow';
import { PureJwtPayload } from '../types/pure-jwt-payload';

export const signToken = (payload: any) => {
  const secret = config().apiservice.jwt_secret as string;
  const token = sign(payload, secret);
  return token;
};

export const decodeToken = (token: string): Result<PureJwtPayload, Error> => {
  try {
    const secret = config().apiservice.jwt_secret as string;
    const payload = verify(token, secret) as PureJwtPayload;
    return ok(payload);
  } catch (e) {
    return err(e);
  }
};
