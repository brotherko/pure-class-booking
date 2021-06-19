export type Auditable<T> = T & {
  createdAt?: Date;
  updatedAt?: Date;
}