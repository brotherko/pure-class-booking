import { NextFunction, Request, Response } from 'express';
import { schedulesCollection } from '../../../services/db';


export const ScheduleRoute = {
  getByLocation: async (req: Request<{ locationId: string }>, res: Response, next: NextFunction) => {
    const { locationId } = req.query;
    const getSchedules = await schedulesCollection.getByLocation(locationId as string);
    if (getSchedules.isErr()) {
      return next(Error('Not able to get schedules'))
    }
    return res.json({
      data: getSchedules.value
    });
  },
}