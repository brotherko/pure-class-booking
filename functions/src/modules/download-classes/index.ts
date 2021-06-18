import { ViewScheduleRequestParams } from '../../services/pure-api-service/interfaces/view-schedule-request-param';
import logger from '../../utils/logger';
import * as functions from 'firebase-functions';
import { getClassesData } from '../../services/pure-api-service';
import { DateTime, Duration } from 'luxon';
import { bulkWrite, db } from '../../utils/db-helper';

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

const fetchClassData = async (startDate: string) => {
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
const downloadClassData = async (startDate: string) => {

  const classData = await fetchClassData(startDate);

  try {
    await bulkWrite(classData, {
      getRef: (doc) => db.collection('classes').doc(doc.id.toString()),
    })

    logger.info(`Classes[Total: ${classData.length}] Download - OK`);

  } catch(e) {
    throw new Error('Unable to save class data to db');
  }
}

const task = async () => {
  const date = DateTime.now().minus(Duration.fromObject({ days: 2 })).toFormat("yyyy-LL-dd");

  logger.info(`starting to get class data from ${date}`)

  await downloadClassData(date);

  logger.info(`class data - OK`)
}

export const downloadClassesJob = functions.pubsub.schedule('00 06 * * *').timeZone('Asia/Hong_Kong').onRun(task);
export const downloadClassesHttp = functions.https.onRequest(task);
