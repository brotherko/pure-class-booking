import axios, { AxiosInstance } from 'axios';
import { db } from '../../utils/db-helper';
import logger from '../../utils/logger';
import { DEFAULT_HEADERS, PURE_API_URL } from './constants';

let pureApi: AxiosInstance;

const getExtraHeaders = async () => {
  const snapshot = await db.collection('configs').doc('extraHeaders').get();
  if (!snapshot) {
    throw new Error('Extra header not found in DB');
  }
  return snapshot.data()
}

const getHeaders = async () => {
  const extraHeader = await getExtraHeaders();
  const headers =  {
    ...DEFAULT_HEADERS,
    ...extraHeader,
  }

  return headers;
}

const init = async () => {
  const headers = await getHeaders();
  logger.debug(`Headers: ${JSON.stringify(headers)}`)
  return axios.create({
    baseURL: PURE_API_URL,
    headers,
  });
}

export const getInstance = async () => {
  if (!pureApi) {
    pureApi = await init();
  }
  return pureApi;
}
