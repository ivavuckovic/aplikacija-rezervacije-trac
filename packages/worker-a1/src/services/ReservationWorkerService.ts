import crypto                   from 'crypto';
import { v4 as uuidv4 }         from 'uuid';
import { prisma }               from '../database/prismaClient';
import { workerPublisher }      from '../messaging/rabbitMQPublisher';
import {
  ReservationMessage,
  ReservationCreatedEvent,
  ReservationFailedEvent,
  ValidationResult,
  ROUTING_KEYS,
} from '../types';
import {
  ReservationStatus,
  PromoCodeStatus,
} from '../generated/prisma';

export class ReservationWorkerService {

  // ════════════════════════════════════════════════════
  //  GLAVNA METODA — Obrada jedne rezervacije
  // ════════════════════════════════════════════════════
  async processReservation(message: ReservationMessage): Promise<void> {
    const { correlationId } = message;

    console.log(`\n🔄 Processing reservation [${correlationId}]`);

    try {
      // 1. Idempotentnost — provjeri da nije već obrađeno
      const alreadyProcessed = await this.checkAlreadyProcessed(correlationId);
      if (alreadyProcessed) {
        console.log(`⏭  [${correlationId}] Already processed — skipping`);
        return;
      }

      // 2. Validacija kapaciteta termina
      const slotValidation = await this.validateSlots(message.services);
      if (!slotValidation.valid) {
        await this.handleFailure(message, slotValidation.reason!);
        return;
      }

      // 3. Validacija promo-koda (ako postoji)
      let promoCodeRecord = null;
      if (message.promoCode && message.priceBreakdown.promoCodeApplied) {
        const promoValidation = await this.validatePromoCode(
          message.promoCode,
          correlationId,
        );
        if (!promoValidation.valid) {
          // Promo-kod nije validan — nastavi BEZ promo popusta
          console.warn(`⚠  [${correlationId}] Promo code invalid at processing time: ${promoValidation.reason}`);
          message.priceBreakdown.promoCodeApplied  = false;
          message.priceBreakdown.discountType      = 'DATE_BASED';
          message.priceBreakdown.discountAmountRsd = message.priceBreakdown.basePriceRsd * 0.10;
          message.priceBreakdown.finalPriceRsd     = message.priceBreakdown.basePriceRsd - message.priceBreakdown.discountAmountRsd;
          message.priceBreakdown.finalPriceForeign = message.priceBreakdown.finalPriceRsd * message.priceBreakdown.exchangeRate;
        } else {
          promoCodeRecord = promoValidation.record;
        }
      }

      // 4. Dohvati usluge sa kategorijama (za event payload)
      const serviceDetails = await this.getServiceDetails(
        message.services.map((s) => s.serviceId),
      );

      // 5. Generiši šifru i promo-kod za novu rezervaciju
      const sifra        = this.generateSifra();
      const newPromoCode = this.generatePromoCodeStr();

      // 6. Atomičan transakcioni upis
      const reservation = await prisma.$transaction(async (tx) => {

        // 6a. Ažuriraj PENDING → CONFIRMED
        const updated = await tx.reservation.update({
          where: { correlationId },
          data: {
            sifra,
            status:              ReservationStatus.CONFIRMED,
            discountType:        message.priceBreakdown.discountType as any,
            discountAmountRsd:   message.priceBreakdown.discountAmountRsd,
            finalPriceRsd:       message.priceBreakdown.finalPriceRsd,
            finalPriceForeign:   message.priceBreakdown.finalPriceForeign,
            promoCodeApplied:    message.priceBreakdown.promoCodeApplied
              ? message.promoCode
              : null,
            promoRejectionReason: !message.priceBreakdown.promoCodeApplied && message.promoCode
              ? 'Promo-kod nije bio validan u momentu obrade'
              : null,
          },
          include: { reservationServices: true },
        });

        // 6b. Kreiraj promo-kod za ovu rezervaciju
        await tx.promoCode.create({
          data: {
            code:                     newPromoCode,
            status:                   PromoCodeStatus.ACTIVE,
            discountPercentage:       5.00,
            generatedByReservationId: updated.id,
          },
        });

        // 6c. Označi iskorišćeni promo-kod kao USED
        if (promoCodeRecord && message.priceBreakdown.promoCodeApplied) {
          await tx.promoCode.update({
            where: { code: message.promoCode!.toUpperCase() },
            data: {
              status:              PromoCodeStatus.USED,
              usedByReservationId: updated.id,
              usedAt:              new Date(),
            },
          });
        }

        return updated;
      });

      console.log(`✅ [${correlationId}] Reservation confirmed → ID: ${reservation.id}, Sifra: ${sifra}`);

      // 7. Publish reservation.created event ka A.2
      await this.publishCreatedEvent(
        reservation.id,
        correlationId,
        message,
        newPromoCode,
        serviceDetails,
      );

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [${correlationId}] Processing error:`, errMsg);
      throw error; // Neka Consumer odluči o NACK/retry
    }
  }

  // ════════════════════════════════════════════════════
  //  VALIDACIJA KAPACITETA TERMINA
  // ════════════════════════════════════════════════════
  private async validateSlots(
    services: { serviceId: number; slotDatetime: string }[],
  ): Promise<ValidationResult> {
    for (const item of services) {
      const slotDatetime = new Date(item.slotDatetime);

      // Dohvati max kapacitet za uslugu
      const service = await prisma.service.findFirst({
        where: { id: item.serviceId, isActive: true },
      });

      if (!service) {
        return {
          valid:  false,
          reason: `INVALID_SERVICE:${item.serviceId}`,
        };
      }

      // Broji potvrđene rezervacije za ovaj termin
      const bookedCount = await prisma.reservationService.count({
        where: {
          serviceId:    item.serviceId,
          slotDatetime,
          reservation: { status: ReservationStatus.CONFIRMED },
        },
      });

      if (bookedCount >= service.maxKlijenataPoTerminu) {
        return {
          valid:  false,
          reason: `SLOT_FULL:service_${item.serviceId}:${slotDatetime.toISOString()}`,
        };
      }
    }

    return { valid: true };
  }

  // ════════════════════════════════════════════════════
  //  VALIDACIJA PROMO-KODA
  // ════════════════════════════════════════════════════
  private async validatePromoCode(
    code:          string,
    correlationId: string,
  ): Promise<ValidationResult & { record?: any }> {
    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      return { valid: false, reason: 'PROMO_NOT_FOUND' };
    }

    if (promo.status !== PromoCodeStatus.ACTIVE) {
      return {
        valid:  false,
        reason: `PROMO_${promo.status}`, // PROMO_USED | PROMO_INACTIVE
      };
    }

    return { valid: true, record: promo };
  }

  // ════════════════════════════════════════════════════
  //  IDEMPOTENTNOST — da li je reservacija već obrađena
  // ════════════════════════════════════════════════════
  private async checkAlreadyProcessed(correlationId: string): Promise<boolean> {
    const existing = await prisma.reservation.findUnique({
      where:  { correlationId },
      select: { status: true },
    });

    // Ako status nije PENDING, već je obrađeno
    return existing !== null && existing.status !== ReservationStatus.PENDING;
  }

  // ════════════════════════════════════════════════════
  //  DOHVATI DETALJE USLUGA (za event payload)
  // ════════════════════════════════════════════════════
  private async getServiceDetails(serviceIds: number[]) {
    return prisma.service.findMany({
      where:   { id: { in: serviceIds } },
      include: { category: true },
    });
  }

  // ════════════════════════════════════════════════════
  //  PUBLISH reservation.created EVENT
  // ════════════════════════════════════════════════════
  private async publishCreatedEvent(
    reservationId: number,
    correlationId: string,
    message:       ReservationMessage,
    promoCode:     string,
    serviceDetails: Awaited<ReturnType<typeof this.getServiceDetails>>,
  ): Promise<void> {
    const event: ReservationCreatedEvent = {
      eventId:             uuidv4(),
      eventType:           'reservation.created',
      timestamp:           new Date().toISOString(),
      sourceReservationId: reservationId,
      correlationId,
      email:               message.personalData.email,
      currency:            message.currency,
      finalPriceRsd:       message.priceBreakdown.finalPriceRsd,
      finalPriceForeign:   message.priceBreakdown.finalPriceForeign,
      discountType:        message.priceBreakdown.discountType,
      discountAmountRsd:   message.priceBreakdown.discountAmountRsd,
      promoCodeApplied:    message.priceBreakdown.promoCodeApplied
        ? message.promoCode
        : undefined,
      createdAt:           new Date().toISOString(),
      services:            message.services.map((s) => {
        const detail = serviceDetails.find((d) => d.id === s.serviceId);
        return {
          serviceId:        s.serviceId,
          serviceNaziv:     detail?.naziv ?? '',
          categoryId:       detail?.categoryId ?? 0,
          categoryNaziv:    detail?.category.naziv ?? '',
          slotDatetime:     s.slotDatetime,
          priceSnapshotRsd: Number(detail?.cenaRsd ?? 0),
        };
      }),
    };

    const published = await workerPublisher.publish(
      ROUTING_KEYS.RESERVATION_CREATED,
      event,
    );

    if (!published) {
      // Logiraj grešku ali ne rušimo ceo process —
      // A.2 može naknadno sinhronizovati
      console.error(`❌ Failed to publish reservation.created for ID: ${reservationId}`);
    }
  }

  // ════════════════════════════════════════════════════
  //  OBRADA GREŠKE — označi rezervaciju kao FAILED
  // ════════════════════════════════════════════════════
  async handleFailure(
    message: ReservationMessage,
    reason:  string,
  ): Promise<void> {
    const { correlationId } = message;
    console.warn(`⚠  [${correlationId}] Reservation failed: ${reason}`);

    try {
      // Ažuriraj status u FAILED
      await prisma.reservation.update({
        where: { correlationId },
        data:  { status: ReservationStatus.FAILED },
      });

      // Upiši u reservation_errors za audit
      await prisma.reservationError.create({
        data: {
          correlationId,
          reason,
          payload: message as any,
        },
      });

      // Publish failed event
      const failedEvent: ReservationFailedEvent = {
        eventId:       uuidv4(),
        eventType:     'reservation.failed',
        timestamp:     new Date().toISOString(),
        correlationId,
        reason,
      };

      await workerPublisher.publish(ROUTING_KEYS.RESERVATION_FAILED, failedEvent);

    } catch (error) {
      console.error(`❌ Error handling failure for [${correlationId}]:`, error);
    }
  }

  // ════════════════════════════════════════════════════
  //  HELPER — Generisanje šifre i promo-koda
  // ════════════════════════════════════════════════════
  private generateSifra(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  private generatePromoCodeStr(): string {
    const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let   result = '';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return `TRAC-${result}`;
  }
}

export const reservationWorkerService = new ReservationWorkerService();
