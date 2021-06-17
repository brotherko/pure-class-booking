export type LoginRequestPayload = {
  language_id: number,
  region_id: number,
  jwt: boolean,
  platform: 'Web',
  username: string,
  password: string,
}