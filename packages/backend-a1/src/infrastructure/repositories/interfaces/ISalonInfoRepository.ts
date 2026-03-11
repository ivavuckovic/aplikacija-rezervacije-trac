import { SalonInfo } from '../../../generated/prisma';

export interface UpdateSalonInfoData {
  naziv?:        string;
  lokacija?:     string;
  opis?:         string;
  radnoVremeOd?: string;
  radnoVremeDo?: string;
}

export interface ISalonInfoRepository {
  get(): Promise<SalonInfo | null>;
  update(data: UpdateSalonInfoData): Promise<SalonInfo>;
}
