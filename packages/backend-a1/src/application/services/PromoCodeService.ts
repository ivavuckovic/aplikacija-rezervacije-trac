import { PromoCode, PromoCodeStatus } from '../../generated/prisma';
import { promoCodeRepository }        from '../../infrastructure/repositories';

export class PromoCodeService {
  private readonly PREFIX    = 'TRAC-';
  private readonly CODE_LEN  = 6;
  private readonly MAX_TRIES = 10;

  async validate(code: string): Promise<{
    valid:   boolean;
    promo:   PromoCode | null;
    message: string;
  }> {
    if (!code || code.trim() === '') {
      return { valid: false, promo: null, message: 'Promo-kod nije unet' };
    }

    const promo = await promoCodeRepository.findByCode(code.toUpperCase().trim());

    if (!promo) {
      return { valid: false, promo: null, message: 'Promo-kod ne postoji' };
    }

    if (promo.status === PromoCodeStatus.USED) {
      return { valid: false, promo, message: 'Promo-kod je već iskorišćen' };
    }

    if (promo.status === PromoCodeStatus.INACTIVE) {
      return { valid: false, promo, message: 'Promo-kod je deaktiviran' };
    }

    return {
      valid:   true,
      promo,
      message: `Promo-kod validan — ${Number(promo.discountPercentage)}% popusta`,
    };
  }

  async generateForReservation(reservationId: number): Promise<PromoCode> {
    let attempts = 0;

    while (attempts < this.MAX_TRIES) {
      const code = this.generateCode();

      const existing = await promoCodeRepository.findByCode(code);
      if (!existing) {
        return promoCodeRepository.create(code, reservationId);
      }

      attempts++;
    }

    throw new Error('Failed to generate unique promo code after max attempts');
  }

  async markAsUsed(code: string, reservationId: number): Promise<PromoCode> {
    return promoCodeRepository.markAsUsed(code.toUpperCase(), reservationId);
  }

  async deactivateForReservation(reservationId: number): Promise<void> {
    await promoCodeRepository.deactivateByReservationId(reservationId);
  }

  private generateCode(): string {
    const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let   result = '';

    for (let i = 0; i < this.CODE_LEN; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }

    return `${this.PREFIX}${result}`;
  }
}

export const promoCodeService = new PromoCodeService();
