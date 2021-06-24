import { PureUser } from "../pure-api-service/login-response-payload";
import { Auditable } from "./auditable";

export type Declaration = {
  success: boolean;
};

export type User = Auditable<
  PureUser & {
    password: string;
    exp?: number;
    declarations?: {
      [key: string]: Auditable<Declaration>;
    };
  }
>;

export type UserBasicInfo = Omit<User, "password" | "jwt" | "token">;
