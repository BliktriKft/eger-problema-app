import type { InstitutionType } from '../constants/categories.js';

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  address: string;
  latitude: number;
  longitude: number;
  officialUrl: string | null;
}