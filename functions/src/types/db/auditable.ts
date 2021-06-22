import { firestore } from 'firebase-admin';

export type Auditable<T> = T & {
  id: string;
  createdAt?: Date | firestore.FieldValue;
  updatedAt?: Date | firestore.FieldValue;
};
