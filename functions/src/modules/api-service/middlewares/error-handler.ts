import { NextFunction, Request, Response } from 'express';

export const expressErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (!err) next();
  return res.status(400).json({
    message: err.message
  })
}