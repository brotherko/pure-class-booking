import { err, ok, Result, ResultAsync } from 'neverthrow';
import { db, bulkGet, Condition } from '../../../utils/db-helper';
 import { Order, OrderJoinUser, OrderStatus } from '../../../types/order';
import { logger } from 'firebase-functions';
import { getUsers } from './users';

 const COLLECTION = 'orders';

export const createOrder = (order: Partial<Order>) => {
  const payload = {
    status: OrderStatus.PENDING,
    ...order,
  }
  return ResultAsync.fromPromise(db.collection(COLLECTION).add(payload), () => Error('Unable to create order in DB'));
}

export const deleteUserOrder = async (id: string, userId: string) => {
  const getOrder_ = await getOrder(id);
  if (getOrder_.isErr()) {
    return err(getOrder_.error);
  }
  if (!getOrder_.value.exists) {
    return err(Error('Order do not exist'));
  }
  const order = getOrder_.value.data() as Order;
  if (order.userId !== userId) {
    err(Error('Permission deney'));
  }
  const getOrderDelete = await deleteOrderUnsafe(id);
  if (getOrderDelete.isErr()) {
    logger.error(getOrderDelete.error.message)
    return err(getOrderDelete.error)
  }
  return ok(order);
}

export const deleteOrderUnsafe = (id: string) => ResultAsync.fromPromise(db.collection(COLLECTION).doc(id).delete(), () => Error('Unable to get order in DB'));

export const getOrder = (id: string) => ResultAsync.fromPromise(db.collection(COLLECTION).doc(id).get(), () => Error('Unable to get order in DB'));

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
