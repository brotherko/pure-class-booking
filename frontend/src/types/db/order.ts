import { Auditable } from './auditable';
import { Schedule } from './schedule';
import { UserBasicInfo } from './user';

export enum OrderStatus {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export type Order = Auditable<{
  _id: string;
  bookingId?: number;
  user: UserBasicInfo;
  schedule: Schedule;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}>