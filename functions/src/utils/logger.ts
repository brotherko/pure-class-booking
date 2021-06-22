import * as winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    ({
      timestamp, level, message, ...meta
    }) => `${timestamp} [${level}]: ${message}\n${meta ? JSON.stringify(meta) : ''}`,
  ),
);

const transports = [new winston.transports.Console(), new LoggingWinston()];

const logger = winston.createLogger({
  level: (process.env.NODE_ENV || 'development') === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});

export default logger;
