import { NextFunction, Request, Response } from 'express';
import { usersCollection } from '../../../services/db';
import { postLogin } from '../../../services/pure-api-service';
import { PureUser } from '../../../types/pure-api-service/login-response-payload';
import { PureUserCredential } from '../../../types/pure-user-credential';
import { signToken } from '../../../utils/auth';
import logger from '../../../utils/logger';

export const loginRoute = {
  post: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body as PureUserCredential;

      if (!username || !password) {
        return next(Error('username or password not found'));
      }
      const getLogin = await postLogin({
        language_id: 1,
        region_id: 1,
        jwt: true,
        platform: 'Web',
        username,
        password,
      });

      if (getLogin.isErr()) {
        logger.debug(getLogin.error.message);
        return next(Error('Incorrect username or password'));
      }

      const {
        user,
        jwtPayload,
      } = getLogin.value;

      const { uid } = jwtPayload;

      if (!uid) {
        return next(Error('Unexpected error: UID not found'));
      }

      const token = signToken(jwtPayload);

      const getUpsertUser = await usersCollection.upsert(uid, { ...user, username, password });
      if (getUpsertUser.isErr()) {
        logger.error('Unable to save user data to db');
        return next(getUpsertUser.error);
      }

      return res.json({
        message: `Welcome! ${user.first_name} ${user.last_name}`,
        data: {
          ...user,
          jwt: token,
        } as PureUser,
      });
    } catch (e) {
      return next(e);
    }
  },
};
