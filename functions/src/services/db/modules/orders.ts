import { ResultAsync } from 'neverthrow';
import { db, bulkGet, Condition } from '../../../utils/db-helper';
 import { Order, OrderStatus } from '../../../types/order';


export const createOrder = (order: Partial<Order>) => {
  const payload = {
    status: OrderStatus.PENDING,
    ...order,
  }
  return ResultAsync.fromPromise(db.collection('orders').add(payload), () => Error('Unable to create order in DB'));
}

export const getOrders = (conditions: Partial<Order>) => {
  const { userId, status } = conditions;
  const conds: Condition[] = [];
  if (userId) {
    conds.push({
      key: 'userId',
      op: '==',
      value: userId
    })
  }
  if (status) {
    conds.push({
      key: 'status',
      op: '==',
      value: status
    })
  }
  return bulkGet<Order>('orders', conds);
}