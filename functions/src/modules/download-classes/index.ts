import * as functions from 'firebase-functions';
import { DateTime, Duration } from 'luxon';
import { err, ok, Result } from 'neverthrow';
import _ from 'lodash';
import { getClassesData, getLocationRaw } from '../../services/pure-api-service';
import logger from '../../utils/logger';
import { schedulesCollection } from '../../services/db';
import { locationsCollection } from '../../services/db/collections/locations';
import { PureSchedule } from '../../types/pure-api-service/class';
import { ViewScheduleRequestParams } from '../../types/pure-api-service/view-schedule-request-param';
import { Location } from '../../types/db/location';
import { Schedule } from '../../types/db/schedule';
import { taskHttpResponse } from '../../utils/http-task-wrapper';

const params: ViewScheduleRequestParams = {
  language_id: 1,
  region_id: 1,
  teacher_id: '0',
  class_type_id: '0',
  level_id: '0',
  pillar_id: '0',
  // "location_ids": 18, // debug
  days: '7',
  filter_type: '',
  start_date: '2021-06-12',
  include_events: '0',
};

const fetchRawSchedules = async (startDate: string) => {
  try {
    const {
      data: {
        error,
        data: { classes: classData },
      },
    } = await getClassesData({
      ...params,
      start_date: startDate,
    });

    if (!classData || error.code !== 200) {
      throw new Error('Data is not in correct format');
    }
    return classData;
  } catch (e) {
    throw new Error(`Unable to fetch class data: ${e}`);
  }
};

const transformSchedules = (schedules: PureSchedule[]) => schedules.map((schedule) => ({
  ...schedule,
  start_datetime: new Date(schedule.start_datetime),
  end_datetime: new Date(schedule.end_datetime),
})) as PureSchedule[];

const downloadScheduleData = async (startDate: string): Promise<Result<boolean, Error>> => {
  const raw = await fetchRawSchedules(startDate);
  const transformed = transformSchedules(raw) as Schedule[];

  const getWrite = await schedulesCollection.createMany(transformed);

  if (getWrite.isErr()) {
    logger.info(`Classes[Total: ${transformed.length}] Download - OK`);
    return err(getWrite.error);
  }
  return ok(true);
};

const downloadLocations = async () => {
  const getRaw = await getLocationRaw({
    language_id: 1,
    region_id: 1,
  });
  if (getRaw.isErr()) {
    logger.error('Unable to fetch raw location');
    return err(getRaw.error);
  }
  const locations = _.get(getRaw.value, ['data', 'data', 'locations']);

  if (!locations) {
    logger.error('location not found in payload');
  }
  const getWrite = await locationsCollection.createMany(
    locations as Location[], //
  );

  if (getWrite.isErr()) {
    logger.info('saved');
    return err(Error('Can not save'));
  }
  return ok(true);
};

const task = async () => {
  const date = DateTime.now().toFormat('yyyy-LL-dd');

  logger.info(`starting to get class data from ${date}`);
  const getDownloadScheduleData = await downloadScheduleData(date);
  if (getDownloadScheduleData.isErr()) {
    logger.info('Schedule data - OK');
  }

  logger.info('getting latest location data');
  await downloadLocations();
  logger.info('Location - OK');
};

export const downloadClassesJob = functions.pubsub
  .schedule('00 06 * * *')
  .timeZone('Asia/Hong_Kong')
  .onRun(task);
export const downloadClassesHttp = functions.https.onRequest(taskHttpResponse(task));
