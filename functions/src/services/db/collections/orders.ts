import { err, ok } from 'neverthrow';
import { Order, OrderStatus } from '../../../types/db/order';
import logger from '../../../utils/logger';
import { Condition, createCollection } from '../absracts/collection';

const basic = createCollection<Order>('orders');

export const deleteUserOrder = async (
  id: string, //
  userId: string,
) => basic.delete(id, (doc) => doc.user.id === userId);

export const getUserOrders = async (userId: string) => {
  const conds: Condition<Order>[] = [];
  conds.push({
    key: 'user.id',
    op: '==',
    value: userId,
  });
  const getOrders = await basic.getMany(conds);
  if (getOrders.isErr()) {
    return err(getOrders.error);
  }

  const { value: orders } = getOrders;
  orders.sort((a, b) => b.schedule.start_datetime.valueOf() - a.schedule.start_datetime.valueOf());
  return ok(orders.slice(0, 10)); // return latest 10 rows
};

export const ordersCollection = {
  ...basic,
  deleteUserOrder,
  getUserOrders,
};
