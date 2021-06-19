import { ResultAsync } from 'neverthrow';
import { bulkGet, Condition } from '../../../utils/db-helper';
import { ClassSchedule } from '../../pure-api-service/interfaces/class';

const COLLECTION = 'classes';

export const getSchedulesByDateRange = (startDate: Date, endDate: Date) => {
  const conds: Condition[] = [];
  conds.push({
    key: 'start_datetime',
    op: '>',
    value: startDate
  })
  // conds.push({
  //   key: 'end_datetime',
  //   op: '<',
  //   value: endDate
  // })

  return bulkGet<ClassSchedule>(COLLECTION, conds);
}
