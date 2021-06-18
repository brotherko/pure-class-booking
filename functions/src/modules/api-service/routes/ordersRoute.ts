import { NextFunction, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import { createOrder, deleteUserOrder, getOrders } from '../../../services/db';
import { Order, OrderStatus } from '../../../types/order';

export const OrdersRoute = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    const { uid } = req.jwtPayload;
    const orders = await getOrders({
      userId: uid,
    });
    if (orders.isErr()) {
      return next(Error('Unable to fetch orders'))
    }
    return res.json({
      data: orders
    });
  },
  post: async (req: Request, res: Response, next: NextFunction) => {
    const { uid } = req.jwtPayload;
    const { classId } = req.body as Pick<Order, 'classId'>;
    if (!classId) {
      return next(Error('class Id not found'));
    }
    const getCreateOrder = await createOrder({
      userId: uid,
      classId,
      status: OrderStatus.PENDING
    })
    if (getCreateOrder.isErr()) {
      return next(Error('Unable to create order'))
    }
    return res.json({
      data: {
        id: getCreateOrder.value.id,
        message: 'Order has been created'
      }
    })
  },
  delete: async (req: Request, res: Response, next: NextFunction) => {
    const { params: { id } = { } } = req;
    const { uid } = req.jwtPayload;
    if (!id) {
      return next(Error('Must contain ID'));
    }
    const getDeleteOrder = await deleteUserOrder(id, uid);
    if (getDeleteOrder.isErr()) {
      return next(Error(`Unable to delete order: ${getDeleteOrder.error.message}`));
    }
    return res.json({
      id,
      message: 'Order has been deleted'
    })
  }
}