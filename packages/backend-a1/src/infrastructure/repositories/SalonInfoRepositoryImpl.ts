import { SalonInfo } from '../../generated/prisma';
import { prisma } from '../database/prismaClient';
import {
  ISalonInfoRepository,
  UpdateSalonInfoData,
} from './interfaces/ISalonInfoRepository';

export class SalonInfoRepositoryImpl implements ISalonInfoRepository {

  async get(): Promise<SalonInfo | null> {
    return prisma.salonInfo.findFirst();
  }

  async update(data: UpdateSalonInfoData): Promise<SalonInfo> {
    const existing = await this.get();

    if (!existing) {
      return prisma.salonInfo.create({
        data: {
          naziv:        data.naziv        ?? 'Salon Trač',
          lokacija:     data.lokacija     ?? '',
          opis:         data.opis         ?? '',
          radnoVremeOd: data.radnoVremeOd ?? '09:00',
          radnoVremeDo: data.radnoVremeDo ?? '21:00',
        },
      });
    }

    return prisma.salonInfo.update({
      where: { id: existing.id },
      data,
    });
  }
}
