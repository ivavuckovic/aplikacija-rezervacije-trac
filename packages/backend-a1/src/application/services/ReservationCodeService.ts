import crypto from 'crypto';

export class ReservationCodeService {
  private readonly BYTE_LENGTH = 16;

  generateSifra(): string {
    return crypto.randomBytes(this.BYTE_LENGTH).toString('hex').toUpperCase();
  }

  generateCorrelationId(): string {
    return crypto.randomUUID();
  }

  isValidSifraFormat(sifra: string): boolean {
    return /^[A-F0-9]{32}$/.test(sifra);
  }
}

export const reservationCodeService = new ReservationCodeService();
