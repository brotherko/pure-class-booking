import _ from 'lodash';
import { err, ok, Result } from 'neverthrow';
import { createCollection } from '../absracts/collection';
import { User, UserBasicInfo } from '../../../types/db/user';

const basic = createCollection<User>('users');

const getBasicInfo = async (id: string): Promise<Result<UserBasicInfo, Error>> => {
  const get = await basic.get(id);
  if (get.isErr()) {
    return err(get.error);
  }
  const doc = get.value as User;
  const filteredDoc = _.pick(doc, [
    'id',
    'first_name',
    'last_name',
    'mbo_rssid',
    'mbo_uid',
    'username',
  ]);
  return ok(filteredDoc);
};

export const usersCollection = {
  ...basic,
  getBasicInfo,
};
