import { logger } from 'firebase-functions';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import * as admin from 'firebase-admin';
import _ from 'lodash';

export const db = admin.firestore();

export type Condition = {
  key: string;
  op: FirebaseFirestore.WhereFilterOp;
  value: any;
}

const MAX_WRITES_PER_BATCH = 500;

async function bulkGet<T>(collection: string, conditions?: Condition[]): Promise<Result<T[], Error>> {
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

async function bulkWrite<T>(collection: string, data: T[], getId: (doc: T) => string, options: FirebaseFirestore.SetOptions): Promise<Result<number, Error>> {
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

export function createCollection<T>(collectionId: string) {

  const create = (doc: Partial<T>) => {
    return ResultAsync.fromPromise(
      db.collection(collectionId).add(doc) as Promise<FirebaseFirestore.DocumentReference<T>>,
      () => Error(`Unable to create doc`)
    );
  }

  const upsert = (id: string, doc: Partial<T>) => {
    return ResultAsync.fromPromise(db.collection('users').doc(id).set(doc, { merge: true }), () => Error('Unable to upsert user in DB'))
  }

  const get = (id: string) => ResultAsync.fromPromise(db.collection(collectionId).doc(id).get() as Promise<FirebaseFirestore.DocumentSnapshot<T>>, () => Error('Unable to get by id'));

  const _removeUnsafe = (id: string) => ResultAsync.fromPromise(db.collection(collectionId).doc(id).delete(), () => Error('Unable to delete'));
  
  const remove = async (id: string, canDeleteCb: (doc: T) => boolean) => {
    const getDoc = await get(id);
    if (getDoc.isErr()) {
      return err(getDoc.error);
    }

    const doc = getDoc.value.data();

    if (!doc) {
      return err(Error('Doc does not exist'));
    }

    if(!canDeleteCb(doc)){
      return err('Can not delete this doc');
    }

    const getDelete = await _removeUnsafe(id);
    if (getDelete.isErr()) {
      logger.error(getDelete.error.message)
      return err(getDelete.error)
    }
    return ok(getDoc.value);
  }
  
  const getMany = (conditions?: Condition[]) => {
    return bulkGet<T>(collectionId, conditions);
  }

  const createMany = (data: T[], getId: (doc: T) => string, options: FirebaseFirestore.SetOptions) => {
    return bulkWrite<T>(collectionId, data, getId, options)
  }

  return { get, create, upsert, remove, getMany, createMany }
  
}