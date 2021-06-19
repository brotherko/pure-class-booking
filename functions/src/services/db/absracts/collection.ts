import { logger } from 'firebase-functions';
import { err, ok, ResultAsync } from 'neverthrow';
import { bulkGet, bulkWrite, BulkWriteOptions, Condition, db, _bulkWrite } from '../../../utils/db-helper';


function createCollection<T>(collectionId: string) {
  const create = (doc: Partial<T>) => {
    return ResultAsync.fromPromise(
      db.collection(collectionId).add(doc),
      () => Error(`Unable to create doc`)
    );
  }

  const getById = (id: string) => ResultAsync.fromPromise(db.collection(collectionId).doc(id).get(), () => Error('Unable to get by id'));

  const _removeUnsafe = (id: string) => ResultAsync.fromPromise(db.collection(collectionId).doc(id).delete(), () => Error('Unable to delete'));
  
  const remove = async (id: string, userId: string) => {
    const getDoc = await getById(id);
    if (getDoc.isErr()) {
      return err(getDoc.error);
    }
    if (!getDoc.value.exists) {
      return err(Error('Doc does not exist'));
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
    return _bulkWrite<T>(collectionId, data, getId, options)
  }
  
}