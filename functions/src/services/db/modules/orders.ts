import { err, ok, Result, ResultAsync } from 'neverthrow';
import { db, bulkGet, Condition } from '../../../utils/db-helper';
 import { Order, OrderJoinUser, OrderStatus } from '../../../types/order';
import { OrdersRoute } from '../../../modules/api-service/routes/ordersRoute';
import { logger } from 'firebase-functions';
import { User } from '../../../types/user';
import { getUsers } from './users';

 const COLLECTION = 'orders';

export const createOrder = (order: Partial<Order>) => {
  const payload = {
    status: OrderStatus.PENDING,
    ...order,
  }
  return ResultAsync.fromPromise(db.collection(COLLECTION).add(payload), () => Error('Unable to create order in DB'));
}

export const deleteOrder = (id: string) => {
  ResultAsync.fromPromise(db.collection(COLLECTION).doc(id).delete(), () => Error('Unable to delete order in DB'))
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
  return bulkGet<Order>(COLLECTION, conds);
}

export const getFullOrders = async (conditions: Partial<Order>): Promise<Result<OrderJoinUser[], Error>> => {
  const orders = await getOrders(conditions);
  const users = await getUsers();

  if (orders.isErr() || users.isErr()) {
    logger.error(`Can not fetch orders or users data`);
    return err(Error('Order fetching error'));
  }
  const merged = orders.value.map(order => ({
      ...order,
      user: users.value.find(user => user._id === order.userId)
    })) as OrderJoinUser[]

  return ok(merged);
};
