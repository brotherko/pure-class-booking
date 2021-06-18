import _ from 'lodash';

import * as admin from 'firebase-admin';
import logger from './logger';
import { err, ok, Result } from 'neverthrow';


export type Condition = {
  key: string;
  op: FirebaseFirestore.WhereFilterOp;
  value: string;
}

const MAX_WRITES_PER_BATCH = 500;
type BulkWriteOptions<T> = {
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
    logger.error(`bulkGet from ${collection} failed`);
    return err(e)
  }
}

export async function bulkWrite<T>(data: T[], { getRef, options }: BulkWriteOptions<T>) {
  const chunks = _.chunk(data, MAX_WRITES_PER_BATCH);

  logger.debug(`Starting batch save ${data.length} rows as total of ${chunks.length} batch`)

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach((doc) => {
      batch.set(getRef(doc), doc, options || {});
    })
    await batch.commit();
    logger.debug(`done batch save`)
  }
}
