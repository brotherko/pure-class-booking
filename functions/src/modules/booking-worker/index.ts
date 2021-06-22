import * as functions from 'firebase-functions';
import { err, ok, Result } from 'neverthrow';
import { postBooking } from '../../services/pure-api-service';
import logger from '../../utils/logger';
import { ordersCollection, usersCollection } from '../../services/db';
import { OrderStatus } from '../../types/db/order';
import { BookingRequestPayload } from '../../types/pure-api-service/booking-request-payload';

const BASE_PAYLOAD: BookingRequestPayload = {
  language_id: 1, // 1 = English, 2 = Chinese
  region_id: 1,
  booked_from: 'WEB',
  book_type: 1,
};

const makeBooking = async (
  jwt: string,
  classId: string | number,
): Promise<Result<number, Error>> => {
  const payload: BookingRequestPayload = {
    ...BASE_PAYLOAD,
    class_id: classId,
  };

  try {
    const {
      data: { error, data },
    } = await postBooking(payload, jwt);
    const { booking_id: bookingId } = data || {};
    if (!data || error.code !== 200 || !bookingId) {
      return err(Error(error.message || 'Unable to book'));
    }
    return ok(bookingId);
  } catch (e) {
    return err(e);
  }
};

export const task = async () => {
  logger.info('Booking task start');
  const getOrders = await ordersCollection.getMany([
    {
      key: 'status',
      op: '==',
      value: OrderStatus.PENDING,
    },
  ]);

  // TODO: should not query all
  const users = await usersCollection.getMany();

  logger.debug(getOrders);

  if (users.isErr() || getOrders.isErr()) {
    logger.error('get pendingOrders | users err');
    return;
  }

  const ordersMerged = getOrders.value.map((order) => ({
    ...order,
    user: users.value.find((user) => user.id === order.user.id),
  }));

  const promises: Promise<Result<number, Error>>[] = [];
  ordersMerged.forEach(({ user: { jwt } = {}, schedule: { id: scheduleId } }) => {
    if (!jwt || !scheduleId) {
      // this is confirmed to be fail. will be handle together with those failed orders
      promises.push(
        new Promise((resolve) => resolve(err(Error('Jwt or classId not found in order')))),
      );
    } else {
      promises.push(makeBooking(jwt, scheduleId));
    }
  });

  const responses = await Promise.all(promises);

  const failedCount = responses.filter((res) => res.isErr()).length;

  const updates = getOrders.value.map(({ id }, idx) => {
    const res = responses[idx];
    if (res.isErr()) {
      return {
        id,
        status: OrderStatus.FAIL,
        error: res.error.toString(),
      };
    }
    return {
      id,
      status: OrderStatus.SUCCESS,
      bookingId: res.value,
    };
  });

  logger.debug(updates);

  logger.info(
    `Booking OK -  Success: ${getOrders.value.length - failedCount} Fail: ${failedCount}`,
  );

  try {
    await ordersCollection.updateMany(updates);

    logger.info("Stored order's result");
  } catch (e) {
    logger.error(`Can not booking result to database: ${e}`);
  }
};

export const startBookingJob = functions
  .region('asia-east2')
  .pubsub.topic('start-booking')
  .onPublish(async (message) => {
    if (message.attributes.action === 'warmup') {
      logger.info('Warmup confirm');
      return;
    }
    await task();
  });

export const startBookingHttp = functions.https.onRequest(task);
