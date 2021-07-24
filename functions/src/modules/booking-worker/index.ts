import * as functions from 'firebase-functions';
import {
  err, Ok, ok, Result,
} from 'neverthrow';
import { DateTime } from 'luxon';
import cron from 'node-cron';
import { postBooking } from '../../services/pure-api-service';
import logger from '../../utils/logger';
import { ordersCollection, usersCollection } from '../../services/db';
import { OrderAttempt, OrderMerged, OrderStatus } from '../../types/db/order';
import { BookingRequestPayload } from '../../types/pure-api-service/booking-request-payload';
import { delay } from '../../utils/delay';

const BOOKING_DAYS_IN_ADVANCE = 2;
const BASE_PAYLOAD: BookingRequestPayload = {
  language_id: 1, // 1 = English, 2 = Chinese
  region_id: 1,
  booked_from: 'WEB',
  book_type: 1,
};
const BOOKING_SCHEDULE_DEV = ['00 */1 * * * *', '30 * * * * *'];
const BOOKING_SCHEDULE_PROD = [
  '58 59 08 * * *',
  '59 59 08 * * *',
  '00 00 09 * * *',
  '01 00 09 * * *',
];

const makeBooking = async (
  jwt: string,
  classId: string | number,
): Promise<Result<number, Error>> => {
  const payload: BookingRequestPayload = {
    ...BASE_PAYLOAD,
    class_id: classId,
  };

  try {
    const { data: { error, data } } = await postBooking(payload, jwt);
    const { booking_id: bookingId } = data || {};
    if (!data || error.code !== 200 || !bookingId) {
      return err(Error(error.message || 'Unable to book'));
    }
    return ok(bookingId);
  } catch (e) {
    return err(e);
  }
};

const getProcessDay = () => {
  const today = DateTime.now();
  return today.plus({ days: BOOKING_DAYS_IN_ADVANCE }).toFormat('yyyy-LL-dd');
};

const getPendingOrders = async (date: string): Promise<Result<OrderMerged[], Error>> => {
  logger.info(`Booking processing order at ${date}`);

  const getOrders = await ordersCollection.getMany([
    {
      key: 'status',
      op: '==',
      value: OrderStatus.PENDING,
    },
    {
      key: 'schedule.date',
      op: '==',
      value: date,
    },
  ]);

  // TODO: should not query all
  const users = await usersCollection.getMany();

  logger.debug(getOrders);

  if (users.isErr() || getOrders.isErr()) {
    return err(Error('Unable to fetch orders'));
  }

  const ordersMerged = getOrders.value.map(
    (order) => ({
      ...order,
      user: users.value.find((user) => user.id === order.user.id),
    } as OrderMerged),
  );

  return ok(ordersMerged);
};

const saveBooking = (orderId: string, attemptAt: Date, response: Result<number, Error>) => {
  const attempt: OrderAttempt = response.isErr()
    ? {
      status: OrderStatus.FAIL,
      error: response.error.toString(),
      attemptAt,
    }
    : {
      status: OrderStatus.SUCCESS,
      bookingId: response.value,
      attemptAt,
    };
  const order = {
    id: orderId,
    attempts: {
      [attemptAt.getTime()]: attempt,
    },
  };
  ordersCollection.upsert(orderId, order);
};

const handleBooking = async (orders: OrderMerged[]) => {
  const attemptTime = new Date();
  const responses = await Promise.all(orders.map(
    ({ user: { jwt } = {}, schedule: { id: scheduleId } }) => {
      if (!jwt || !scheduleId) {
        // this is confirmed to be fail. will be handle together with those failed orders
        return new Promise((resolve) => resolve(err(Error('Jwt or classId not found in order'))));
      }
      return makeBooking(jwt, scheduleId);
    },
  ) as Promise<Result<number, Error>>[]);
  const failed = responses.filter((res) => res.isErr());

  orders.map(({ id }, idx) => {
    const res = responses[idx];
    saveBooking(id, attemptTime, res);
  });

  logger.info(`Booking OK -  Success: ${orders.length - failed.length} Fail: ${failed.length}`);
};

const getCronSchedules = () => {
  const isDev = process.env.FUNCTIONS_EMULATOR === 'true';
  const schedules = isDev ? BOOKING_SCHEDULE_DEV : BOOKING_SCHEDULE_PROD;
  logger.info(`Using schedule: ${schedules}`);
  return schedules;
};

const executeBooking = async () => {
  const date = getProcessDay();
  const getOrders = await getPendingOrders(date);
  if (getOrders.isErr()) {
    logger.error(getOrders.error.message);
    return;
  }
  const { value: orders } = getOrders;
  if (!orders || orders.length === 0) {
    logger.info('SKIP: No pending orders');
    return;
  }
  const cronSchedules = getCronSchedules();
  cronSchedules.forEach((schedule) => {
    cron.schedule(
      schedule,
      async () => {
        const start = new Date();
        logger.info(`Schedule[${schedule}] started`);

        await handleBooking(orders);

        const time = (new Date().getTime() - start.getTime()) / 1000;
        logger.info(`schedule[${schedule}] finished ${time}s`);
      },
      {
        timezone: 'Asia/Hong_Kong',
      },
    );
  });
  // return null;
};

const verifyBooking = async () => {
  const date = getProcessDay();
  const getOrders = await getPendingOrders(date);
  if (getOrders.isErr()) {
    return logger.error(getOrders.error);
  }
  const { value: orders } = getOrders;
  if (orders.length === 0) {
    return logger.error('SKIP: No orders');
  }
  const updates = orders.map(({ id, attempts }) => {
    const status = attempts && Object.keys(attempts).some((key) => attempts[key].status === OrderStatus.SUCCESS)
      ? OrderStatus.SUCCESS
      : OrderStatus.FAIL;
    return {
      id,
      status,
    };
  });
  const updateOrders = await ordersCollection.updateMany(updates);
  if (updateOrders.isErr()) {
    logger.error('Unable to verify booking');
  }
  return true;
};

export const startBookingJob = functions
  .runWith({
    timeoutSeconds: 300,
  })
  .region('asia-east2')
  .pubsub.schedule('58 08 * * *')
  .timeZone('Asia/Hong_Kong')
  .onRun(async () => {
    executeBooking();
    await delay(300); // keep alive
    return true;
  });

export const verifyBookingJob = functions
  .region('asia-east2')
  .pubsub.schedule('05 09 * * *')
  .timeZone('Asia/Hong_Kong')
  .onRun(async () => {
    await verifyBooking();
    return true;
  });
