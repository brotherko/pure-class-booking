import { err, ok, Result, ResultAsync } from 'neverthrow';
import * as admin from 'firebase-admin';
import _ from 'lodash';
import logger from '../../../utils/logger';
import { firestore } from 'firebase-admin';
import { Auditable } from '../types/auditable';

export const db = admin.firestore();

export type Condition<T> = {
  key: keyof T | string;
  op: FirebaseFirestore.WhereFilterOp;
  value: any;
}

const MAX_WRITES_PER_BATCH = 500;

function addAudit<T>(doc: T) {
  return ({
    ...doc,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp()
  } as Auditable<T>) 
}

function updateAudit<T>(doc: T) {
  return ({
    ...doc,
    updatedAt: firestore.FieldValue.serverTimestamp()
  } as Auditable<T>) 
}

async function bulkGet<T>(collection: string, conditions?: Condition<T>[]): Promise<Result<T[], Error>> {
  let q = db.collection(collection).offset(0);
  if (conditions) {
    for (const { key, op, value } of conditions) {
      q = q.where(key as string, op, value);
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

async function bulkWrite<T>(collection: string, data: Partial<T>[], getId: (doc: Partial<T>) => string, options?: FirebaseFirestore.SetOptions): Promise<Result<number, Error>> {
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

  const create = (_doc: Partial<T>) => {
    const doc = addAudit(_doc);
    logger.debug(`create ${collectionId}`, doc)
    return ResultAsync.fromPromise(
      db.collection(collectionId).add(doc) as Promise<FirebaseFirestore.DocumentReference<T>>,
      () => Error(`Unable to create doc`)
    );
  }

  const upsert = async (id: string, doc: Partial<T>) => {
    const get_ = await getRef(id);
    let data;
    if (get_.isErr()){
      data = addAudit(doc);
    } else {
      data = get_.value.exists ? updateAudit(doc) : addAudit(doc);
    }
    logger.debug(`upsert ${collectionId}`, data)
    return ResultAsync.fromPromise(db.collection(collectionId).doc(id).set(data, { merge: true }), () => Error('Unable to upsert user in DB'))
  }

  const getRef = (id: string) => ResultAsync.fromPromise(db.collection(collectionId).doc(id).get() as Promise<FirebaseFirestore.DocumentSnapshot<T>>, () => Error('Unable to get by id'));

  const get = async (id: string) => {
    const get_ = await getRef(id);
    if (get_.isErr()) {
      return err(get_.error)
    }
    if (!get_.value.exists) {
      return err(Error('Doc do not exist'));
    }
    return ok(get_.value.data());
  }

  const _removeUnsafe = (id: string) => ResultAsync.fromPromise(db.collection(collectionId).doc(id).delete(), () => Error('Unable to delete'));
  
  const remove = async (id: string, canDeleteCb: (doc: T) => boolean) => {
    const getDoc = await getRef(id);
    if (getDoc.isErr()) {
      return err(getDoc.error);
    }

    const doc = getDoc.value.data();

    if (!doc) {
      return err(Error('Doc does not exist'));
    }

    if(!canDeleteCb(doc)){
      return err(Error('Can not delete this doc'));
    }

    const getDelete = await _removeUnsafe(id);
    if (getDelete.isErr()) {
      logger.error(getDelete.error.message)
      return err(getDelete.error)
    }
    return ok(getDoc.value);
  }
  
  const getMany = (conditions?: Condition<T>[]) => {
    return bulkGet<T>(collectionId, conditions);
  }

  const createMany = (data: Partial<T>[], getId: (doc: Partial<T>) => string, options?: FirebaseFirestore.SetOptions) => {
    return bulkWrite<T>(collectionId, data, getId, options)
  }

  return { get, getRef, create, upsert, delete: remove, getMany, createMany }
  
}