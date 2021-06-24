import { Second } from "../firestore-second";

export type Auditable<T> = T & {
  id: string;
  createdAt?: Second;
  updatedAt?: Second;
};
