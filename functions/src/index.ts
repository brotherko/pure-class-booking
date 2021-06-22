import * as admin from 'firebase-admin';
import { Settings } from 'luxon';

admin.initializeApp();
Settings.defaultZoneName = 'HongKong';

export * from './modules/download-extra-headers';
export * from './modules/refresh-jwts';
export * from './modules/download-classes';
export * from './modules/booking-worker';
export * from './modules/api-service';
