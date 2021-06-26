import { NextFunction, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import { decodeToken } from '../../../utils/auth';

export const expressJwtAuth = (req: Request, _res: Response, next: NextFunction) => {
  const auth = req.header('authorization');
  if (!auth) {
    return next(Error('Credential not found'));
  }
  const [scheme, credentials] = auth.split(' ');

  if (!/^Bearer$/i.test(scheme)) {
    return next(Error('Credential not found'));
  }
  const token = credentials;

  const getPayload = decodeToken(token);
  if (getPayload.isErr()) {
    logger.info(getPayload.error);
    return next(Error('Malform Jwt'));
  }

  req.jwtPayload = getPayload.value;
  return next();
};
