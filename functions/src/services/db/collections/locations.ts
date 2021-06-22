import { Location } from '../../../types/db/location';
import { createCollection } from '../absracts/collection';

const basic = createCollection<Location>('locations');

export const locationsCollection = {
  ...basic,
};
