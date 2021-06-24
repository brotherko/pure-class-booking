import { Schedule } from '../../../types/db/schedule';
import { Condition, createCollection } from '../absracts/collection';

const basic = createCollection<Schedule>('schedules');

const getByLocation = (locationId: string) => {
  console.log(locationId);
  const conds: Condition<Schedule>[] = [
    {
      key: 'locationId',
      op: '==',
      value: locationId,
    },
  ];
  return basic.getMany(conds);
};

export const schedulesCollection = {
  ...basic,
  getByLocation,
};
