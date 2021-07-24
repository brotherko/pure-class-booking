import { PureSchedule } from '../pure-api-service/class';
import { Auditable } from './auditable';
import { Location } from './location';

export type Schedule = Auditable<{
  id: string;
  date: string;
  name: string;
  sector: 'F' | 'Y';
  isVaccinated: boolean;
  startDatetime: Date;
  endDatetime: Date;
  location?: Location;
  locationId: string;
  duration: number;
}>;
