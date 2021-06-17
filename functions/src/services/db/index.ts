import _ from 'lodash';

import * as admin from 'firebase-admin';
import logger from '../../utils/logger';

export const db = admin.firestore();

const MAX_WRITES_PER_BATCH = 500;
type BulkWriteOptions<T> = {
  getRef: (doc: T) => FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
  options?: FirebaseFirestore.SetOptions,
}

type Condition = {
  key: string;
  op: FirebaseFirestore.WhereFilterOp;
  value: string;
}

export async function bulkGet<T>(collection: string, conditions?: Condition[]) {
  let q = db.collection(collection).offset(0);
  if (conditions) {
    for (const { key, op, value } of conditions) {
      q = q.where(key, op, value);
    }
  }
  const snapshot = await q.get();
  const data: T[] = [];
  for (const doc of snapshot.docs) {
    data.push({
        ...doc.data(),
        _id: doc.id,
      } as unknown as T)
  }
  return data;
}

export async function bulkWrite<T>(data: T[], { getRef, options }: BulkWriteOptions<T>) {
  const chunks = _.chunk(data, MAX_WRITES_PER_BATCH);

  logger.debug(`Starting batch save ${data.length} rows as total of ${chunks.length} batch`)

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach((doc, idx) => {
      batch.set(getRef(doc), doc, options || {});
    })
    await batch.commit();
    logger.debug(`done batch save`)
  }
}