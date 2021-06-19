import { Condition, createCollection } from '../absracts/collection';
import { Schedule } from '../types/schedule';

const basic = createCollection<Schedule>('classes');

const getByLocation = (locationId: string) => {
  const conds: Condition<Schedule>[] = [{
    key: 'location_id',
    op: '==',
    value: locationId
  }];
  return basic.getMany(conds);
}
const getByDateRange = (startDate: Date) => {
  const conds: Condition<Schedule>[] = [];
  conds.push({
    key: 'start_datetime',
    op: '>',
    value: startDate
  })
  return basic.getMany(conds);
}

export const schedulesCollection = {
  ...basic,
  getByLocation,
  getByDateRange
}