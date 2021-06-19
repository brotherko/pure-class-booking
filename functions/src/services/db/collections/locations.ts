import { ResultAsync } from 'neverthrow';
import { bulkGet, db } from '../../../utils/db-helper';
import { User } from '../../../types/user';
import { Location } from '../../pure-api-service/interfaces/location';

const COLLECTIONS = 'locations';

export const getLocations = () => bulkGet<Location>(COLLECTIONS);




