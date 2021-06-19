import logger from '../../utils/logger';
import * as functions from 'firebase-functions';
import { delay } from '../../utils/delay';
import { firestore } from 'firebase-admin';
import { postLogin } from '../../services/pure-api-service';
import { usersCollection } from '../../services/db';

const task = async () => {
  const users = await usersCollection.getMany();
  // TODO: only get those need to make order?
  if (users.isErr()) {
    logger.error('Unable to fetch users');
    throw new Error('Task failed');
  }
  for (const { _id, username, password } of users.value) {
    const getJwt = await postLogin({ 
      username,
      password
    });
    if (getJwt.isErr()) {
      logger.debug(`User[${username}] JWT refresh - Failed: ${getJwt.error.message}`);
      return;
    }

    const { user: { jwt }, jwtPayload: { exp } } = getJwt.value;

    await usersCollection.upsert(_id, {
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


