import { Schedule } from '../../../types/db/schedule';
import { Condition, createCollection } from '../absracts/collection';

const basic = createCollection<Schedule>('classes');

const getByLocation = (locationId: number) => {
  console.log(locationId);
  const conds: Condition<Schedule>[] = [
    {
      key: 'location_id',
      op: '==',
      value: locationId,
    },
  ];
  return basic.getMany(conds);
};

// TODO: to remove?
const getByDateRange = (startDate: Date) => {
  const conds: Condition<Schedule>[] = [];
  conds.push({
    key: 'start_datetime',
    op: '>',
    value: startDate,
  });
  return basic.getMany(conds);
};

export const schedulesCollection = {
  ...basic,
  getByLocation,
  getByDateRange,
};
