import { Auditable } from "./auditable";

export type Location = Auditable<{
  id: number;
  name: string;
  shortName: string;
  sector: "F" | "Y";
}>;
