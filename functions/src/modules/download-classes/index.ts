import { ViewScheduleRequestParams } from '../../services/pure-api-service/interfaces/view-schedule-request-param';
import logger from '../../utils/logger';
import * as functions from 'firebase-functions';
import { getClassesData, getLocationRaw } from '../../services/pure-api-service';
import { DateTime, Duration } from 'luxon';
import { PureSchedule } from '../../services/pure-api-service/interfaces/class';
import { err, ok } from 'neverthrow';
import _ from 'lodash';
import { schedule } from 'firebase-functions/lib/providers/pubsub';
import { schedulesCollection } from '../../services/db';
import { locationsCollection } from '../../services/db/collections/locations';

const params: ViewScheduleRequestParams = {
  "language_id":1,
  "region_id":1,
  "teacher_id":"0",
  "class_type_id":"0",
  "level_id":"0",
  "pillar_id":"0",
  // "location_ids": 18, // debug
  "days":"7",
  "filter_type":"",
  "start_date":"2021-06-12",
  "include_events":"0"
}

const fetchRawSchedules = async (startDate: string) => {
  try {
    const { data: { error, data: { classes: classData } } } = await getClassesData({
      ...params,
      start_date: startDate
    });

    if (!classData || error.code !== 200) {
      throw new Error('Data is not in correct format');
    }
    return classData;
  } catch (e) {
    throw new Error(`Unable to fetch class data: ${e}`);
  }
}

const transformSchedules = (schedules: PureSchedule[]) => {
  return schedules.map((schedule) => ({
    ...schedule,
    start_datetime: new Date(schedule.start_datetime),
    end_datetime: new Date(schedule.end_datetime)
  })) as PureSchedule[]
}

const downloadClassData = async (startDate: string) => {
  try {
    const raw = await fetchRawSchedules(startDate);
    const transformed = transformSchedules(raw);

    const getWrite = await schedulesCollection.createMany(transformed, (doc) => {
      if (!doc.id) {
        throw new Error();
      }
      return doc.id.toString()
    })

    if (getWrite.isOk()) {
      logger.info(`Classes[Total: ${transformed.length}] Download - OK`);
    }

  } catch(e) {
    throw new Error('Unable to save class data to db');
  }
}

const downloadLocations = async () => {
  const getRaw = await getLocationRaw({
    language_id: 1,
    region_id: 1,
  });
  if (getRaw.isErr()) {
    logger.error('Unable to fetch raw location');
    return err(getRaw.error);
  }
  const locations = _.get(getRaw.value, ['data', 'data', 'locations'])

  if (!locations) {
    logger.error('location not found in payload')
  }
  const getWrite = await locationsCollection.createMany(locations, (doc) => {
    if (!doc.id) {
      throw new Error();
    }
    return doc.id.toString()
  })

  if (getWrite.isErr()) {
    logger.info(`saved`)
    return err(Error('Can not save'));
  }
  return ok(true);
}

const task = async () => {
  const date = DateTime.now().minus(Duration.fromObject({ days: 2 })).toFormat("yyyy-LL-dd");

  logger.info(`starting to get class data from ${date}`)

  // await downloadClassData(date);
  await downloadLocations();

  logger.info(`class data - OK`)
}

export const downloadClassesJob = functions.pubsub.schedule('00 06 * * *').timeZone('Asia/Hong_Kong').onRun(task);
export const downloadClassesHttp = functions.https.onRequest(task);
