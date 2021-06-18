import { User } from './user';

export enum OrderStatus {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}


export type Order = {
  _id: string;
  userId?: string;
  username: string;
  classId: string;
  status: OrderStatus;
  bookingId?: number;
  error?: string;
}

export type OrderJoinUser = Order & {
  user: User
}