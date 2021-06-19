import _ from 'lodash';

import * as admin from 'firebase-admin';
import logger from './logger';
import { err, ok, Result } from 'neverthrow';


export type Condition = {
  key: string;
  op: FirebaseFirestore.WhereFilterOp;
  value: any;
}

const MAX_WRITES_PER_BATCH = 500;
export type BulkWriteOptions<T> = {
  getRef: (doc: T) => FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
  options?: FirebaseFirestore.SetOptions,
}

export const db = admin.firestore();

export async function bulkGet<T>(collection: string, conditions?: Condition[]): Promise<Result<T[], Error>> {
  let q = db.collection(collection).offset(0);
  if (conditions) {
    for (const { key, op, value } of conditions) {
      q = q.where(key, op, value);
    }
  }
  const data: T[] = [];
  try {
    const snapshot = await q.get();
    for (const doc of snapshot.docs) {
      data.push({
          ...doc.data(),
          _id: doc.id,
        } as unknown as T)
    }
    return ok(data);
  } catch(e) {
    logger.error(e.message);
    return err(e)
  }
}

export async function _bulkWrite<T>(collection: string, data: T[], getId: (doc: T) => string, options: FirebaseFirestore.SetOptions) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return err(Error('Incorrect data format'))
  }
  const chunks = _.chunk(data, MAX_WRITES_PER_BATCH);

  logger.debug(`Starting batch save ${data.length} rows as total of ${chunks.length} batch`)
  let batchId = 0

  try {
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach((doc) => {
        batch.set(db.collection(collection).doc(getId(doc)), doc, options || {});
      })
      await batch.commit();
      logger.debug(`Batch #{batchId} - OK`)
      batchId += 1
    }
    return ok(data.length);
  } catch(e) {
    logger.error(`Batch write failed at ${batchId}: ${e.message}`)
    return err(e)
  }
}


export async function bulkWrite<T>(data: T[], { getRef, options }: BulkWriteOptions<T>) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return err(Error('Incorrect data format'))
  }
  const chunks = _.chunk(data, MAX_WRITES_PER_BATCH);

  logger.debug(`Starting batch save ${data.length} rows as total of ${chunks.length} batch`)
  let batchId = 0

  try {
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach((doc) => {
        batch.set(getRef(doc), doc, options || {});
      })
      await batch.commit();
      logger.debug(`Batch #{batchId} - OK`)
      batchId += 1
    }
    return ok(data.length);
  } catch(e) {
    logger.error(`Batch write failed at ${batchId}: ${e.message}`)
    return err(e)
  }
}
