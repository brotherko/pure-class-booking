export type LoginResponsePayload = {
  user: {
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
}