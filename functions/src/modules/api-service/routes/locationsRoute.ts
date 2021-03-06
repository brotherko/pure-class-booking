import { NextFunction, Request, Response } from 'express';
import { locationsCollection } from '../../../services/db/collections/locations';

export const LocationsRoute = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const get = await locationsCollection.getMany();
      if (get.isErr()) {
        return next(Error('Not able to get locations'));
      }
      return res.json({
        data: get.value,
      });
    } catch (e) {
      return next(e);
    }
  },
};
