import { PureUser } from '../pure-api-service/login-response-payload';
import { Auditable } from './auditable';

export type User = Auditable<PureUser & {
  password: string;
  exp?: number;
}>

export type UserBasicInfo = Omit<User, "password"|"jwt"|"token">
