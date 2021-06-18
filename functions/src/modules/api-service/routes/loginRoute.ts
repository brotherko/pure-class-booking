import { NextFunction, Request, Response } from 'express';
import { upsertUser } from '../../../services/db';
import { getPureJwt } from '../../../services/pure-api-service';
import { PureUserCredential } from '../../../types/pure-user-credential';
import logger from '../../../utils/logger';

export const loginRoute = {
  post: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body as PureUserCredential;
      if (!username || !password) {
        return next(Error('username or password not found'));
      }

      const getJwt = await getPureJwt({ username, password });
      if (getJwt.isErr()) {
        return next(Error('Incorrect username or password'));
      }

      const [jwt, { uid }] = getJwt.value;

      const runUpsertUser = await upsertUser(uid, { username, password });
      if (runUpsertUser.isErr()) {
        logger.error('Unable to save user data to db');
        return next(Error('Internal Error'));
      }

      return res.json({
        token: jwt
      });
    } catch (e) {
      return next(Error('Internal Error'));
    }
  }
};