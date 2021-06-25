import {
  err, ok, Result, ResultAsync,
} from 'neverthrow';
import * as admin from 'firebase-admin';
import _ from 'lodash';
import { firestore } from 'firebase-admin';
import logger from '../../../utils/logger';
import { Auditable } from '../../../types/db/auditable';

export const db = admin.firestore();

export type Condition<T> = {
  key: keyof T | string;
  op: FirebaseFirestore.WhereFilterOp;
  value: any;
};

const FIRESTORE_MAX_OPS_PER_BATCH = 500;

function createTimestamp<T>(doc: T) {
  return {
    createdAt: firestore.FieldValue.serverTimestamp(),
    ...doc,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  } as Auditable<T>;
}
function updateTimestamp<T>(doc: T) {
  return {
    ...doc,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  } as Auditable<T>;
}

function getQuery<T>(collection: string, conditions?: Condition<T>[]) {
  let q = db.collection(collection).offset(0);
  if (conditions) {
    for (const { key, op, value } of conditions) {
      q = q.where(key as string, op, value);
    }
  }
  return q;
}

async function bulkDelete<T>(
  collection: string,
  conditions?: Condition<T>[],
): Promise<Result<boolean, Error>> {
  logger.info(`Performing batch delete in ${collection}`);
  logger.info(`Condition ${JSON.stringify(conditions)}`);
  try {
    const q = getQuery(collection, conditions);
    const snapshot = await q.get();
    const chunks = _.chunk(snapshot.docs, FIRESTORE_MAX_OPS_PER_BATCH);
    let batchId = 1;
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      logger.debug(`Batch ${batchId} - OK`);
      batchId += 1;
    }
    logger.info(`Batch delete - OK, total ${snapshot.docs.length} in ${batchId} batches`);
    return ok(true);
  } catch (e) {
    logger.error(`Batch delete - Fail: ${e.message}`);
    return err(e);
  }
}

async function bulkGet<T>(
  collection: string,
  conditions?: Condition<T>[],
): Promise<Result<T[], Error>> {
  const q = getQuery(collection, conditions);
  const data: T[] = [];
  try {
    const snapshot = await q.get();
    for (const doc of snapshot.docs) {
      data.push({
        ...doc.data(),
        id: doc.id,
      } as unknown as T);
    }
    return ok(data);
  } catch (e) {
    logger.error(e.message);
    return err(e);
  }
}

async function bulkWrite<T>(
  collection: string,
  data: Partial<T>[],
  isUpsert?: boolean,
): Promise<Result<number, Error>> {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return err(Error('Incorrect data format'));
  }
  const chunks = _.chunk(data, FIRESTORE_MAX_OPS_PER_BATCH);
  logger.debug(`Starting batch save ${data.length} rows as total of ${chunks.length} batch`);
  let batchId = 1;

  try {
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach((_doc) => {
        const doc = isUpsert ? updateTimestamp(_doc) : createTimestamp(_doc);
        batch.set(db.collection(collection).doc(doc.id), doc, isUpsert ? { merge: true } : {});
      });
      await batch.commit();

      logger.debug(`Batch ${batchId} - OK`);
      batchId += 1;
    }
    return ok(data.length);
  } catch (e) {
    logger.error(`Batch write failed at ${batchId}: ${e.message}`);
    return err(e);
  }
}

export function createCollection<T>(collectionId: string) {
  const create = (_doc: Partial<T>) => {
    const doc = createTimestamp(_doc);
    logger.debug(`create ${collectionId}`, doc);
    return ResultAsync.fromPromise(
      db.collection(collectionId).add(doc) as Promise<FirebaseFirestore.DocumentReference<T>>,
      () => Error('Unable to create doc'),
    );
  };

  const getRef = (id: string) => ResultAsync.fromPromise(
      db.collection(collectionId).doc(id).get() as Promise<FirebaseFirestore.DocumentSnapshot<T>>,
      () => Error('Unable to get by id'),
  );

  const upsert = async (id: string, _doc: Partial<T>) => {
    const getDoc = await getRef(id);
    const doc = getDoc.isErr() || !getDoc.value.exists
      ? createTimestamp(_doc) //
      : updateTimestamp(_doc);
    return ResultAsync.fromPromise(
      db.collection(collectionId).doc(id).set(doc, { merge: true }),
      () => Error('Unable to upsert user in DB'),
    );
  };

  const get = async (id: string) => {
    const getGetRef = await getRef(id);
    if (getGetRef.isErr()) {
      return err(getGetRef.error);
    }
    if (!getGetRef.value.exists) {
      return err(Error('Doc do not exist'));
    }
    const doc = {
      id: getGetRef.value.id,
      ...getGetRef.value.data(),
    } as unknown as T;
    return ok(doc);
  };

  const removeUnsafe = (id: string) => ResultAsync.fromPromise(db.collection(collectionId).doc(id).delete(), () => Error('Unable to delete'));

  const remove = async (id: string, canDeleteCb: (doc: T) => boolean) => {
    const getDoc = await getRef(id);
    if (getDoc.isErr()) {
      return err(getDoc.error);
    }

    const doc = getDoc.value.data();

    if (!doc) {
      return err(Error('Doc does not exist'));
    }

    if (!canDeleteCb(doc)) {
      return err(Error('Can not delete this doc'));
    }

    const getDelete = await removeUnsafe(id);
    if (getDelete.isErr()) {
      logger.error(getDelete.error.message);
      return err(getDelete.error);
    }
    return ok(getDoc.value.data());
  };

  const getMany = (conditions?: Condition<T>[]) => bulkGet<T>(collectionId, conditions);

  const deleteMany = (conditions?: Condition<T>[]) => bulkDelete<T>(collectionId, conditions);

  const createMany = (
    data: T[], //
  ) => bulkWrite<T>(collectionId, data, false);

  const updateMany = (
    data: Partial<T>[], //
  ) => bulkWrite<T>(collectionId, data, true);

  return {
    get,
    getRef,
    create,
    upsert,
    delete: remove,
    getMany,
    updateMany,
    createMany,
    deleteMany,
  };
}
