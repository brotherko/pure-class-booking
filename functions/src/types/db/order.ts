import { Auditable } from './auditable';
import { Schedule } from './schedule';
import { User, UserBasicInfo } from './user';

// eslint-disable-next-line no-shadow
export enum OrderStatus {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export type OrderBase = Auditable<{
  bookingId?: number;
  schedule: Schedule;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}>;

export type Order = OrderBase & {
  user: UserBasicInfo;
};

export type OrderMerged = Order & {
  user: User;
};
