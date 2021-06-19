import { firestore } from 'firebase-admin';

export type Auditable<T> = T & {
  createdAt?: Date | firestore.FieldValue;
  updatedAt?: Date | firestore.FieldValue;
}