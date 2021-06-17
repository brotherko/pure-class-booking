export type BookingRequestPayload = {
  language_id: number;
  region_id: number;
  booked_from: string;
  book_type: number;
  class_id?: string;
};
