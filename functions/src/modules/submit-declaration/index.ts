import axios from 'axios';
import querystring from 'querystring';
import * as functions from 'firebase-functions';
import { DateTime } from 'luxon';
import { firestore } from 'firebase-admin';
import { err } from 'neverthrow';
import { usersCollection } from '../../services/db';
import { Declaration, User } from '../../types/db/user';
import logger from '../../utils/logger';
import { Auditable } from '../../types/db/auditable';
import { taskHttpResponse } from '../../utils/http-task-wrapper';

const PURE_DECLARATION_FORM_URL = 'https://form.pure-international.com/form.php?code=TravelDeclarationHK';

const BASE_PAYLOAD = {
  505: '', // name
  5: '', // phone
  65: '', // member id
  610: 2,
  531: 'No',
  501: undefined,
  522: undefined,
  532: 'No',
  533: 'No',
  538: 'no',
  539: undefined,
  504: '1',
  form_id: '2028',
  actions: 'create',
  serial_no: '', // timestamp
  language_id: '1',
  region: 'HK',
};

const getRandomNumber = () => `${6}${Math.floor(Math.random() * 8999999 + 1000000)}`;

const getSerialNo = () => Date.now();

const getPayload = (user: User) => {
  const payload = {
    ...BASE_PAYLOAD,
    505: `${user.first_name} ${user.last_name}`,
    5: getRandomNumber(),
    65: user.mbo_rssid,
    serial_no: getSerialNo(),
  };
  return querystring.stringify(payload);
};

const task = async () => {
  const getUsers = await usersCollection.getMany();
  if (getUsers.isErr()) {
    throw getUsers.error;
  }
  const { value: users } = getUsers;
  const promises: Promise<boolean>[] = [];

  users.forEach((user) => {
    const payload = getPayload(user);
    logger.debug(payload);
    promises.push(
      axios
        .post(PURE_DECLARATION_FORM_URL, payload)
        .then(() => true)
        .catch(() => false),
    );
  });
  try {
    const results = await Promise.all(promises);
    const updates: Partial<User>[] = users.map((user, idx) => ({
      id: user.id,
      declarations: {
        [DateTime.now().toFormat('yyyy-LL-dd')]: {
          createdAt: firestore.FieldValue.serverTimestamp(),
          success: results[idx],
        } as Auditable<Declaration>,
      },
    }));
    const getUpdateUsers = await usersCollection.updateMany(updates);
    if (getUpdateUsers.isErr()) {
      logger.error(getUpdateUsers.error);
      return err(getUpdateUsers.error);
    }
    logger.info('Users declaration - OK');
    return true;
  } catch (e) {
    logger.info('Users declaration - FAILED');
    logger.error(e.message);
    throw new Error(e);
  }
};
export const submitDeclarationJob = functions.pubsub
  .schedule('30 06 * * *')
  .timeZone('Asia/Hong_Kong')
  .onRun(task);
