import { createCollection } from '../absracts/collection';
import { Location } from '../types/location';

const basic = createCollection<Location>('locations');

export const locationsCollection = {
  ...basic,
}
