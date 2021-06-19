import { NextFunction, Request, Response } from 'express';
import jwtDecode from 'jwt-decode';
import { PureJwtPayload } from '../../../types/pure-jwt-payload';



export const expressJwtAuth = () => {
  const _jwtAuth = (req: Request, res: Response, next: NextFunction) => {

    let token: string;

    const auth = req.header('authorization');
    if (!auth) {
      return next(Error('Credential not found'));
    }
    const [scheme, credentials] = auth.split(' ');

    if (!/^Bearer$/i.test(scheme)) {
      return next(Error('Credential not found'));
    }
    token = credentials;

    const payload = jwtDecode<PureJwtPayload>(token)
    if (!payload || !payload.uid) {
      return next(Error('Malform Jwt'));
    }

    req.jwtPayload = payload;
    return next();
  }

  return _jwtAuth;
}