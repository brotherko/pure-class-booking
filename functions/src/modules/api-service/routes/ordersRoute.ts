import { NextFunction, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import {
  deleteUserOrder,
  ordersCollection,
  schedulesCollection,
  usersCollection,
} from '../../../services/db';
import { OrderStatus } from '../../../types/db/order';
import { Schedule } from '../../../types/db/schedule';

const getScheduleName = (schedule: Schedule) => `${schedule.name}@${schedule.date}`;

export const OrdersRoute = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.jwtPayload;
      const orders = await ordersCollection.getUserOrders(uid);
      if (orders.isErr()) {
        return next(Error('Unable to fetch orders'));
      }
      return res.json({
        data: orders.value,
      });
    } catch (e) {
      return next(e);
    }
  },

  post: async (req: Request<{ classId: string }>, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.jwtPayload;
      const { classId } = req.body;
      if (!classId) {
        return next(Error('class Id not found'));
      }
      const getSchedule = await schedulesCollection.get(classId);
      const getUserBasicInfo = await usersCollection.getBasicInfo(uid);
      if (getUserBasicInfo.isErr() || getSchedule.isErr()) {
        logger.error(`Unable to find user[${uid}] / schedule[${classId}] info from DB`);
        return next(Error('Internal error'));
      }

      const getCreateOrder = await ordersCollection.create({
        schedule: getSchedule.value,
        user: getUserBasicInfo.value,
        status: OrderStatus.PENDING,
      });
      if (getCreateOrder.isErr()) {
        return next(Error('Unable to create order'));
      }
      return res.json({
        data: {},
        message: 'Order has been created',
      });
    } catch (e) {
      return next(e);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    const { params: { id } = {} } = req;
    const { uid } = req.jwtPayload;
    if (!id) {
      return next(Error('Must contain ID'));
    }
    const getDeleteOrder = await deleteUserOrder(id, uid);
    if (getDeleteOrder.isErr()) {
      return next(Error(`Unable to delete order: ${getDeleteOrder.error.message}`));
    }
    const { value: deletedOrder } = getDeleteOrder;
    return res.json({
      id,
      message: `Order ${
        deletedOrder ? getScheduleName(deletedOrder.schedule) : ''
      } has been deleted`,
    });
  },
};
