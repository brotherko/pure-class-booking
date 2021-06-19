import { ResultAsync } from 'neverthrow';
import { bulkGet, db } from '../../../utils/db-helper';
import { User } from '../../../types/user';
import { Location } from '../../pure-api-service/interfaces/location';
import { createCollection } from '../absracts/collection';

const basic = createCollection<Location>('location');

export const locationsCollection = {
  ...basic,
}
