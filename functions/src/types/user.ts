export type User = {
  _id: string;
  username: string;
  password: string;
  jwt?: string;
  exp?: number;
}
