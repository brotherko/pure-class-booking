import { bulkGet, bulkWrite, db } from '../../services/db';
import { postBooking } from '../../services/pure-api-service/index';
import { BookingRequestPayload } from '../../services/pure-api-service/interfaces/booking-request-payload';
import { Order, OrderStatus, OrderJoinUser } from '../../types/order';
import { User } from '../../types/user';
import logger from '../../utils/logger';
import * as functions from 'firebase-functions';

const BASE_PAYLOAD: BookingRequestPayload = {
  language_id: 1, // 1 = English, 2 = Chinese
  region_id: 1,
  booked_from: 'WEB',
  book_type: 1,
}

const makeBooking = async (jwt: string, classId: string) => {
  const payload: BookingRequestPayload = {
    ...BASE_PAYLOAD,
    class_id: classId,
  };

  try {
    const { data: { error, data } } = await postBooking(payload, jwt);
    const { booking_id: bookingId } = data || {};
    if (!data || error.code !== 200 || !bookingId) {
      return [OrderStatus.FAIL, error.message]
    }
    return [OrderStatus.SUCCESS, bookingId];
  } catch (e) {
    return [OrderStatus.FAIL, e.toString() as string]
  }
};

const getPendingOrders = async () => {
  const orders = await bulkGet<Order>('orders', [{
    key: 'status',
    op: '==',
    value: OrderStatus.PENDING
  }]);
  const users = await bulkGet<User>('users')

  return orders.map(order => ({
    ...order,
    user: users.find(user => user.username === order.username)
  })) as OrderJoinUser[]
}

export const task = async () => {
  const pendingsOrders = await getPendingOrders();

  logger.debug(pendingsOrders);

  if (!pendingsOrders || pendingsOrders.length === 0) {
    logger.info('SKIP: No pending orders')
    return;
  }

  const promises: Promise<any>[] = []
  pendingsOrders.forEach(({ user: { jwt }, classId }) => {
    if (!jwt || !classId) {
      // this is confirmed to be fail. will be handle together with those failed orders
      promises.push(new Promise(resolve => resolve(-1))); 
    } else {
      promises.push(makeBooking(jwt, classId))
    }
  });

  const responses = await Promise.all(promises);

  const failedCount = responses.filter(res => res[0] === OrderStatus.FAIL).length

  const updates = pendingsOrders.map(({ _id }, idx) => {
    const [status, arg] = responses[idx];
    return {
      _id,
      status,
      [status === OrderStatus.FAIL ? 'error' : 'bookingId']: arg
    }
  })

  logger.info(`Booking OK -  Success: ${pendingsOrders.length - failedCount} Fail: ${failedCount}`)

  try {
    await bulkWrite(updates, {
      getRef: (doc) => db.collection('orders').doc(doc._id.toString()),
      options: {
        merge: true,
      }
    })

  logger.info(`Stored order's result`)

  } catch(e) {
    logger.error(`Can not booking result to database: ${e}`);
  }
}

export const startBookingJob = functions.pubsub.schedule('00 09 * * *').timeZone('Asia/Hong_Kong').onRun(task);
export const startBookingHttp = functions.https.onRequest(task);