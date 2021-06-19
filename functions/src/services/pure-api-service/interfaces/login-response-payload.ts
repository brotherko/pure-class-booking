import { PureUserCredential } from '../../../types/pure-user-credential';

export type PureUser = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  token: string;
  mbo_rssid: string;
  mbo_uid: string;
  bind_chat: boolean;
  jwt: string;
}
export type LoginResponsePayload = {
  user: PureUser
}