export type JwtPayload = {
  iss: string;
  ver: string;
  sub: string;
  iat: number;
  exp: number;
  uid: string;
  sid: string;
}