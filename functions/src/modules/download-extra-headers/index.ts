import axios from 'axios';
import * as functions from 'firebase-functions';
import logger from '../../utils/logger';
import { db } from '../../services/db/absracts/collection';
import cheerio from 'cheerio';

const PURE_HOME_URL = 'https://pure360.pure-fitness.com/en/HK';

const getHeaders = async () => {
  const { data } = await axios.get(PURE_HOME_URL);
  const $ = cheerio.load(data);
  const token = $('meta[name=token]').attr('content');
  const timestamp = $('meta[name=timestamp]').attr('content');
  if (!token || !timestamp) {
    throw new Error('Can not extract x-token and x-date from html page')
  }
  const extraHeaders = {
    'X-Date': timestamp,
    'X-Token': token,
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
    return
  } catch (e) {
    logger.error('Unable to refresh extra headers');
    throw new Error(e);
  }
};

export const refreshExtraHeadersJob = functions.pubsub
  .schedule('00 */2 * * *')
  .timeZone('Asia/Hong_Kong')
  .onRun(task);
