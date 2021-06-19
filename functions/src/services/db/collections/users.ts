import { createCollection } from '../absracts/collection';
import _ from 'lodash';
import { err, ok, Result } from 'neverthrow';
import { User, UserBasicInfo } from '../../../types/db/user';

const basic = createCollection<User>('users');

const getBasicInfo = async (id: string): Promise<Result<UserBasicInfo, Error>> => {
  const get = await basic.get(id);
  if (get.isErr()) {
    return err(get.error);
  }
  const doc = get.value as User;
  const filteredDoc = _.omit(doc, ['password', 'jwt', 'token']);
  return ok(filteredDoc);
}

export const usersCollection = {
  ...basic,
  getBasicInfo,
}
