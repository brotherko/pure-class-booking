import logger from '../../utils/logger';
import * as functions from 'firebase-functions';
import jwtDecode from 'jwt-decode';
import { delay } from '../../utils/delay';
import { PureUserCredential } from '../../types/pure-user-credential';
import { LoginRequestPayload } from '../../services/pure-api-service/interfaces/login-request-payload';
import { postLogin } from '../../services/pure-api-service/index';
import { bulkGet, db } from '../../services/db';
import { User } from '../../types/user';
import { JwtPayload } from '../../types/pure-jwt-payload';

const getPureJwt = async ({ username, password }: PureUserCredential) => {
  const payload: LoginRequestPayload = {
    language_id: 1,
    region_id: 1,
    jwt: true,
    platform: 'Web',
    username,
    password,
  };

  const { data: { data: { user: { jwt } } } } = await postLogin(payload);

  if (!jwt) {
    throw new Error('JWT not found in the response');
  }

  logger.debug(`retrieve JWT: ${jwt}`);

  return jwt;
};

const task = async () => {
  const users = await bulkGet<User>('users');
  for (const { _id, username, password } of users) {
    try {
      const jwt = await getPureJwt({ 
        username,
        password
      });
      const { exp } = jwtDecode<JwtPayload>(jwt);
      await db.collection('users').doc(_id).set({
        jwt,
        exp,
      }, { merge: true })
      logger.debug(`User[${username}] JWT refresh - OK`)
      await delay(2);
    } catch (e) {
      logger.debug(`User[${username}] JWT refresh - Failed: ${e}`);
    }
  }

  logger.info('JWT refresh - Finished');
}

export const refreshUsersJwtJob = functions.pubsub.schedule('55 08 * * *').timeZone('Asia/Hong_Kong').onRun(task);
export const refreshUsersJwtHttp = functions.https.onRequest(task);


