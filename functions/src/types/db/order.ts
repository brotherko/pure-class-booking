import { Auditable } from './auditable';
import { Schedule } from './schedule';
import { UserBasicInfo } from './user';

// eslint-disable-next-line no-shadow
export enum OrderStatus {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export type Order = Auditable<{
  bookingId?: number;
  user: UserBasicInfo;
  schedule: Schedule;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}>;
