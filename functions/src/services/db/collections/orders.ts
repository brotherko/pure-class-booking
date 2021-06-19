 import { Order, OrderStatus } from '../types/order';
import { Condition, createCollection } from '../absracts/collection';

const basic = createCollection<Order>('orders');

export const deleteUserOrder = async (id: string, userId: string) => {
  return basic.delete(id, (doc) => {
    return doc.user.id === userId;
  })
}

export const getUserOrders = (userId: string, status?: OrderStatus) => {
  const conds: Condition<Order>[] = [];
  if (userId) {
    conds.push({
      key: 'user.id',
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
  return basic.getMany(conds);
}

export const ordersCollection = {
  ...basic,
  deleteUserOrder,
  getUserOrders,
}