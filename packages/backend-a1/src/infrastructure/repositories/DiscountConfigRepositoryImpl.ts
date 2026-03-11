import { DiscountConfig } from '../../generated/prisma';
import { prisma } from '../database/prismaClient';
import { IDiscountConfigRepository } from './interfaces/IDiscountConfigRepository';

export class DiscountConfigRepositoryImpl implements IDiscountConfigRepository {

  async getActive(): Promise<DiscountConfig | null> {
    return prisma.discountConfig.findFirst({
      where:   { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsert(
    discountPercentage: number,
    validUntil:         Date,
  ): Promise<DiscountConfig> {
    await prisma.discountConfig.updateMany({
      where: { isActive: true },
      data:  { isActive: false },
    });

    return prisma.discountConfig.create({
      data: {
        discountPercentage,
        validUntil,
        isActive: true,
      },
    });
  }
}
