/* eslint-disable camelcase */
export type ViewScheduleRequestParams = {
  language_id?: number;
  region_id?: number;
  location_ids?: number;
  teacher_id?: string;
  class_type_id?: string;
  level_id?: string;
  pillar_id?: string;
  sector?: 'F' | 'Y';
  days?: string;
  filter_type?: string;
  start_date?: string;
  include_events?: string;
};
