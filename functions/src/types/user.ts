import { firestore } from 'firebase-admin';
import { PureUser } from '../services/pure-api-service/interfaces/login-response-payload';

export type User = PureUser & {
  _id: string;
  password: string;
  exp?: number;
  updatedAt: number | firestore.FieldValue;
}
