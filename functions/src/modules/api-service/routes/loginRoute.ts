import { NextFunction, Request, Response } from 'express';
import { usersCollection } from '../../../services/db';
import { postLogin } from '../../../services/pure-api-service';
import { PureUserCredential } from '../../../types/pure-user-credential';
import logger from '../../../utils/logger';

export const loginRoute = {
  post: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body as PureUserCredential;
      console.log(req.path)
    
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
        return next(Error('Incorrect username or password'));
      }

      const { user, jwtPayload: { uid } } = getLogin.value;

      const getUpsertUser = await usersCollection.upsert(uid, { ...user, username, password });
      if (getUpsertUser.isErr()) {
        logger.error('Unable to save user data to db');
        return next(getUpsertUser.error);
      }

      return res.json({
        message: `Welcome! ${user.first_name} ${user.last_name}`,
        data: user,
      });
    } catch (e) {
      return next(e);
    }
  }
};