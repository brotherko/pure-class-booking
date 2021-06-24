/* eslint-disable camelcase */
interface Names {
  en: string;
}

interface ShortName {
  en: string;
}

interface Address {
  en: string;
}

interface AdditionalInfo {
  en: string;
}

interface District {
  en: string;
}

export interface PureLocation {
  id: number;
  contact_no: string;
  latitude: string;
  longitude: string;
  virtual_tour_link: string;
  region_id: number;
  crm_location_id: number;
  wechat_location_id: number;
  is_yoga: boolean;
  is_fitness: boolean;
  is_public: boolean;
  is_fuze: boolean;
  is_online: boolean;
  names: Names;
  short_name: ShortName;
  address: Address;
  additional_info: AdditionalInfo;
  district: District;
}
