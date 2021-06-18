import logger from '../../utils/logger';
import * as functions from 'firebase-functions';
import { delay } from '../../utils/delay';
import { getPureJwt } from '../../services/pure-api-service';
import { bulkGet } from '../../utils/db-helper';
import { User } from '../../types/user';
import { firestore } from 'firebase-admin';
import { upsertUser } from '../../services/db';

const task = async () => {
  const users = await bulkGet<User>('users');
  if (users.isErr()) {
    logger.error('Unable to fetch users');
    throw new Error('Task failed');
  }
  for (const { _id, username, password } of users.value) {
    const getJwt = await getPureJwt({ 
      username,
      password
    });
    if (getJwt.isErr()) {
      logger.debug(`User[${username}] JWT refresh - Failed: ${getJwt.error.message}`);
      return;
    }

    const [jwt, { exp }] = getJwt.value;

    await upsertUser(_id, {
      jwt,
      exp,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    })
    logger.debug(`User[${username}] JWT refresh - OK`)
    await delay(2);
  }

  logger.info('JWT refresh - Finished');
}

export const refreshUsersJwtJob = functions.pubsub.schedule('55 08 * * *').timeZone('Asia/Hong_Kong').onRun(task);
export const refreshUsersJwtHttp = functions.https.onRequest(task);


