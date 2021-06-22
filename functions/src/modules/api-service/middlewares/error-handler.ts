import { NextFunction, Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const expressErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!err) next();
  return res.status(400).json({
    message: err.message,
  });
};
