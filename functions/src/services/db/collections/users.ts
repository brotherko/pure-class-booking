import { User } from '../../../types/user';
import { createCollection } from '../absracts/collection';

const basic = createCollection<User>('users');

export const usersCollection = {
  ...basic,
}
