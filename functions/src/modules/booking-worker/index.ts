import * as functions from 'firebase-functions';
import { err, ok, Result } from 'neverthrow';
import { DateTime } from 'luxon';
import schedule from 'node-schedule';
import { postBooking } from '../../services/pure-api-service';
import logger from '../../utils/logger';
import { ordersCollection, usersCollection } from '../../services/db';
import { OrderMerged, OrderStatus } from '../../types/db/order';
import { BookingRequestPayload } from '../../types/pure-api-service/booking-request-payload';
import { delay } from '../../utils/delay';

const BOOKING_DAYS_IN_ADVANCE = 2;
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

const fetchBookingPromises = async (orders: OrderMerged[]) => {
  const promises: Promise<Result<number, Error>>[] = [];

  orders.forEach(({ user: { jwt } = {}, schedule: { id: scheduleId } }) => {
    if (!jwt || !scheduleId) {
      // this is confirmed to be fail. will be handle together with those failed orders
      promises.push(
        new Promise((resolve) => resolve(err(Error('Jwt or classId not found in order')))),
      );
    } else {
      promises.push(makeBooking(jwt, scheduleId));
    }
  });

  return ok(Promise.all(promises));
};

const handleBooking = async (promises: Promise<Result<number, Error>[]>, orders: OrderMerged[]) => {
  const responses = await promises;
  const failedCount = responses.filter((res) => res.isErr()).length;

  const updates = orders.map(({ id }, idx) => {
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

  logger.info(`Booking OK -  Success: ${orders.length - failedCount} Fail: ${failedCount}`);

  try {
    await ordersCollection.updateMany(updates);

    logger.info("Stored order's result");
  } catch (e) {
    logger.error(`Can not booking result to database: ${e}`);
  }
};

const getCronSchedule = () => {
  const isDev = process.env.FUNCTIONS_EMULATOR === 'true';
  if (isDev) {
    logger.info('***DEV MODE***');
    return '*/1 * * * *';
  }
  return '00 00 09 * * *';
};

const task = async () => {
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

  const getPromises = await fetchBookingPromises(orders);
  if (getPromises.isErr()) {
    logger.error('Unable to prepare promises to execute booking');
    return null;
  }
  const { value: promises } = getPromises;
  const cron = getCronSchedule();
  const job = schedule.scheduleJob(
    {
      rule: cron,
      tz: 'HongKong',
    },
    async (firedate) => {
      logger.info(`expect: ${firedate}; actual: ${new Date()}`);
      await handleBooking(promises, orders);
      job.cancel();
    },
  );
  return null;
};

export const startBookingJob = functions
  .runWith({
    timeoutSeconds: 300,
  })
  .region('asia-east2')
  .pubsub.schedule('58 08 * * *')
  .timeZone('Asia/Hong_Kong')
  .onRun(async () => {
    await task();
  });
