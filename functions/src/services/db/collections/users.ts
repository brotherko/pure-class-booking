import { ResultAsync } from 'neverthrow';
import { bulkGet, db } from '../../../utils/db-helper';
import { User } from '../../../types/user';

export const getUsers = () => bulkGet<User>('users');

export const upsertUser = (id: string, user: Partial<User>) => {
  return ResultAsync.fromPromise(db.collection('users').doc(id).set(user, { merge: true }), () => Error('Unable to upsert user in DB'))
}

