import axios from 'axios';
import * as functions from 'firebase-functions';
import logger from '../../utils/logger';
import { db } from '../../services/db/absracts/collection';

const PURE_HOME_URL = 'https://pure360.pure-fitness.com/en/HK';

const getHeaders = async () => {
  const { data } = await axios.get(PURE_HOME_URL);
  const re = new RegExp(/{"X-Date":(.*?),"X-Token":"(.*?)"};/);
  const match = data.match(re);
  if (!match) {
    logger.error('Can not extract x-token and x-date from html page');
  }
  const [, xDate, xToken] = match;
  const extraHeaders = {
    'X-Date': xDate,
    'X-Token': xToken,
  };

  logger.debug('get extra headers:', extraHeaders);
  return extraHeaders;
};

const task = async () => {
  try {
    const data = await getHeaders();
    db
      .collection('configs')
      .doc('extraHeaders')
      .set(data);
    logger.info('Successfully update extra headers');
  } catch (e) {
    logger.error('Unable to refresh extra headers');
    throw new Error(e);
  }
};

export const refreshExtraHeadersJob = functions.pubsub
  .schedule('00 */2 * * *')
  .timeZone('Asia/Hong_Kong')
  .onRun(task);
