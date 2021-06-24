import { Second } from "../firestore-second";
import { Auditable } from "./auditable";
import { Location } from "./location";

export type Schedule = Auditable<{
  id: string;
  date: string;
  name: string;
  sector: "F" | "Y";
  startDatetime: Second;
  endDatetime: Second;
  location?: Location;
  locationId: string;
  duration: number;
}>;
