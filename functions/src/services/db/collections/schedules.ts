import { ResultAsync } from 'neverthrow';
import { bulkGet, Condition } from '../../../utils/db-helper';
import { ClassSchedule } from '../../pure-api-service/interfaces/class';
import { createCollection } from '../absracts/collection';

const basic = createCollection<ClassSchedule>('classes');

const getByDateRange = (startDate: Date, endDate: Date) => {
  const conds: Condition[] = [];
  conds.push({
    key: 'start_datetime',
    op: '>',
    value: startDate
  })
  return basic.getMany(conds);
}

export const scheduleCollection = {
  ...basic,
  getByDateRange
}