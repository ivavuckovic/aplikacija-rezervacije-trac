import { PromoCode, PromoCodeStatus } from '../../generated/prisma';
import { prisma } from '../database/prismaClient';
import { IPromoCodeRepository } from './interfaces/IPromoCodeRepository';

export class PromoCodeRepositoryImpl implements IPromoCodeRepository {

  async findByCode(code: string): Promise<PromoCode | null> {
    return prisma.promoCode.findUnique({ where: { code } });
  }

  async findByReservationId(reservationId: number): Promise<PromoCode | null> {
    return prisma.promoCode.findUnique({
      where: { generatedByReservationId: reservationId },
    });
  }

  async create(code: string, reservationId: number): Promise<PromoCode> {
    return prisma.promoCode.create({
      data: {
        code,
        status:                   PromoCodeStatus.ACTIVE,
        discountPercentage:       5.00,
        generatedByReservationId: reservationId,
      },
    });
  }

  async markAsUsed(code: string, reservationId: number): Promise<PromoCode> {
    return prisma.promoCode.update({
      where: { code },
      data:  {
        status:              PromoCodeStatus.USED,
        usedByReservationId: reservationId,
        usedAt:              new Date(),
      },
    });
  }

  async updateStatus(code: string, status: PromoCodeStatus): Promise<PromoCode> {
    return prisma.promoCode.update({
      where: { code },
      data:  { status },
    });
  }

  async deactivateByReservationId(reservationId: number): Promise<void> {
    await prisma.promoCode.updateMany({
      where: { generatedByReservationId: reservationId },
      data:  { status: PromoCodeStatus.INACTIVE },
    });
  }
}
