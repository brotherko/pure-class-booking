import { bulkGet, bulkWrite, db } from '../../utils/db-helper';
import { postBooking } from '../../services/pure-api-service';
import { BookingRequestPayload } from '../../services/pure-api-service/interfaces/booking-request-payload';
import { Order, OrderStatus, OrderJoinUser } from '../../types/order';
import { User } from '../../types/user';
import logger from '../../utils/logger';
import * as functions from 'firebase-functions';
import { err, ok, Result } from 'neverthrow';
import { getFullOrders } from '../../services/db';

const BASE_PAYLOAD: BookingRequestPayload = {
  language_id: 1, // 1 = English, 2 = Chinese
  region_id: 1,
  booked_from: 'WEB',
  book_type: 1,
}

const makeBooking = async (jwt: string, classId: string): Promise<Result<number, Error>> => {
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

export const task = async () => {
  const pendingsOrders = await getFullOrders({ status: OrderStatus.PENDING });

  logger.debug(pendingsOrders);

  if (pendingsOrders.isErr()) {
    logger.error('get pendingOrders err');
    return;
  }

  const promises: Promise<Result<number, Error>>[] = []
  pendingsOrders.value.forEach(({ user: { jwt } = { }, classId }) => {
    if (!jwt || !classId) {
      // this is confirmed to be fail. will be handle together with those failed orders
      promises.push(new Promise(resolve => resolve(err(Error('Jwt or classId not found in order'))))); 
    } else {
      promises.push(makeBooking(jwt, classId))
    }
  });

  const responses = await Promise.all(promises);

  const failedCount = responses.filter(res => res.isErr()).length

  const updates = pendingsOrders.value.map(({ _id }, idx) => {
    const res = responses[idx];
    if (res.isErr()) {
      return {
        _id,
        status: OrderStatus.FAIL,
        errorMessage: res.error.toString(),
      }
    }
    return {
      _id,
      status: OrderStatus.SUCCESS,
      bookingId: res.value
    }
  })

  logger.debug(updates)

  logger.info(`Booking OK -  Success: ${pendingsOrders.value.length - failedCount} Fail: ${failedCount}`)

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