import { NextFunction, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import { DateTime } from 'luxon';
import { getSchedulesByDateRange } from '../../../services/db';
import { getLocations } from '../../../services/db/collections/locations';


export const LocationsRoute = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    const get = await getLocations();
    if (get.isErr()) {
      return next(Error('Not able to get locations'))
    }
    return res.json(get.value);
  },
}