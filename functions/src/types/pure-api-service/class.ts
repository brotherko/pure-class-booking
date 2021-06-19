export interface Pillar {
  name: string;
  color: string;
  code: string;
}

export interface ClassType {
  id: number;
  name: string;
  is_fuze: boolean;
  pillar: Pillar;
  level: string;
}

export interface Teacher {
  id: number;
  name: string;
  full_name: string;
  image_link: string;
  type: string;
}

export interface PureSchedule {
  id: number;
  sector: string;
  class_type_id: number;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  teacher_id: number;
  location_id: number;
  level_id: number;
  pillar_id: number;
  button_status: number;
  booking_id: number;
  start_datetime: Date;
  end_datetime: Date;
  is_free: boolean;
  color_code: string;
  is_filmed: boolean;
  is_online: number;
  is_cycling: boolean;
  free_class_type: number;
  special_flag: string;
  duration_min: number;
  class_type: ClassType;
  teacher: Teacher;
}