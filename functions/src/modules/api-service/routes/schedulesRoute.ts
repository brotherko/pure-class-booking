import { NextFunction, Request, Response } from 'express';
import { logger } from 'firebase-functions';
import { DateTime } from 'luxon';
import { getSchedulesByDateRange } from '../../../services/db';


export const ScheduleRoute = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    const { start_date, end_date } = req.query as { start_date: string, end_date: string };
    logger.debug(req.query);
    const startDate = DateTime.fromFormat(start_date, 'yyyy-LL-dd', {
      zone: 'HongKong',
    }).toJSDate()
    const endDate = DateTime.fromFormat(end_date, 'yyyy-LL-dd', {
      zone: 'HongKong',
    }).toJSDate();
    const getSchedules = await getSchedulesByDateRange(startDate, endDate)
    if (getSchedules.isErr()) {
      return next(Error('Not able to get schedules'))
    }
    return res.json(getSchedules.value);
  },
}