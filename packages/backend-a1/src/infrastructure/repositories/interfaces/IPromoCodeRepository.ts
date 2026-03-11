import { PromoCode, PromoCodeStatus } from '../../../generated/prisma';

export interface IPromoCodeRepository {
  findByCode(code: string): Promise<PromoCode | null>;

  findByReservationId(reservationId: number): Promise<PromoCode | null>;

  create(
    code:          string,
    reservationId: number,
  ): Promise<PromoCode>;

  markAsUsed(
    code:          string,
    reservationId: number,
  ): Promise<PromoCode>;

  updateStatus(
    code:   string,
    status: PromoCodeStatus,
  ): Promise<PromoCode>;

  deactivateByReservationId(reservationId: number): Promise<void>;
}
