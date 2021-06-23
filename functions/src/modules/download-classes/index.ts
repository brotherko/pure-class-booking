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
  // location_ids: 18, // debug
  location_ids: 0,
  days: '7',
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
  id: schedule.id.toString(),
  start_datetime: new Date(schedule.start_datetime),
  end_datetime: new Date(schedule.end_datetime),
}));

const downloadScheduleData = async (startDate: string): Promise<Result<boolean, Error>> => {
  const raw = await fetchRawSchedules(startDate);
  const transformed = transformSchedules(raw) as Schedule[];

  console.log(transformed);

  const getWrite = await schedulesCollection.createMany(transformed);

  if (getWrite.isErr()) {
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

  const transformed = locations.map((location) => ({
    ...location,
    id: location.id.toString()
  }))
  const getWrite = await locationsCollection.createMany(
    transformed as Location[], //
  );

  if (getWrite.isErr()) {
    return err(Error('Can not save'));
  }
  return ok(true);
};

const task = async () => {
  const date = DateTime.now().toFormat('yyyy-LL-dd');

  logger.info(`starting to get class data from ${date}`);
  const getDownloadScheduleData = await downloadScheduleData(date);
  if (getDownloadScheduleData.isErr()) {
    logger.error('Unable to download schedules');
  } else {
    logger.info(`Schedules download - OK`);
  }

  logger.info('getting latest location data');
  const getDownloadLocations = await downloadLocations();
  if (getDownloadLocations.isErr()) {
    logger.error('Unable to download locations')
  } else {
    logger.info('Locations download - OK');
  }
};

export const downloadClassesJob = functions.pubsub
  .schedule('00 06 * * *')
  .timeZone('Asia/Hong_Kong')
  .onRun(task);
export const downloadClassesHttp = functions.https.onRequest(taskHttpResponse(task));
