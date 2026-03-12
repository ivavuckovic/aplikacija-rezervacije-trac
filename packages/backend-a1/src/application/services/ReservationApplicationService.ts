import { v4 as uuidv4 }           from 'uuid';
import { ReservationStatus }       from '../../generated/prisma';

import { reservationRepository }   from '../../infrastructure/repositories';
import { serviceRepository }       from '../../infrastructure/repositories';
import { allowedCurrencyRepository } from '../../infrastructure/repositories';

import { rabbitMQPublisher, ROUTING_KEYS } from '../../infrastructure/messaging/rabbitMQPublisher';

import { exchangeRateService }     from './ExchangeRateService';
import { slotAvailabilityService } from './SlotAvailabilityService';
import { priceCalculationService } from './PriceCalculationService';
import { promoCodeService }        from './PromoCodeService';
import { reservationCodeService }  from './ReservationCodeService';

import type {
  CreateReservationInput,
  CalculatePriceInput as CalculatePriceDTO,
  AddServiceInput,
  RemoveServiceInput,
  CancelReservationInput,
} from '../dto/CreateReservationDTO';

import type {
  PriceBreakdown,
  TimeSlot,
  ReservationMessage,
  ReservationUpdatedEvent,
  ReservationCancelledEvent,
} from '../../domain/types';

export interface InitiateReservationResponse {
  correlationId:  string;
  message:        string;
  priceBreakdown: PriceBreakdown;
}

export interface ReservationStatusResponse {
  correlationId:   string;
  status:          string;
  sifra?:          string;
  promoCode?:      string;
  priceBreakdown?: {
    finalPriceRsd:     number;
    finalPriceForeign: number;
    currency:          string;
    discountType:      string;
    discountAmountRsd: number;
  };
  services?: {
    serviceId:        number;
    serviceNaziv:     string;
    categoryNaziv:    string;
    slotDatetime:     string;
    priceSnapshotRsd: number;
  }[];
  message?: string;
}

export interface ModifyReservationResponse {
  success:        boolean;
  message:        string;
  priceBreakdown?: PriceBreakdown;
}

export class ReservationApplicationService {

  async initiateReservation(
    input: CreateReservationInput,
  ): Promise<InitiateReservationResponse> {

    const currency = await allowedCurrencyRepository.findByCode(input.currency);
    if (!currency || !currency.isActive) {
      throw new Error(`Valuta ${input.currency} nije dozvoljena`);
    }

    const serviceIds = input.services.map((s) => s.serviceId);
    const services   = await serviceRepository.findByIds(serviceIds);
    if (services.length !== serviceIds.length) {
      throw new Error('Jedna ili više usluga nije pronađena ili je neaktivna');
    }

    const slotChecks = input.services.map((s) => ({
      serviceId:    s.serviceId,
      slotDatetime: new Date(s.slotDatetime),
    }));

    const slotResult = await slotAvailabilityService.checkAllSlotsAvailable(slotChecks);
    if (!slotResult.allAvailable) {
      throw new Error(
        `Sledeći termini nisu dostupni: ${slotResult.unavailable
          .map((s) => `service ${s.serviceId} @ ${new Date(s.slotDatetime).toISOString()}`)
          .join(', ')}`,
      );
    }

    const priceBreakdown = await priceCalculationService.calculate({
      serviceIds: serviceIds,
      currency:   input.currency,
      promoCode:  input.promoCode,
    });

    const correlationId = reservationCodeService.generateCorrelationId();

    const message: ReservationMessage = {
      correlationId,
      timestamp: new Date().toISOString(),
      personalData: {
        ime:           input.personalData.ime,
        prezime:       input.personalData.prezime,
        email:         input.personalData.email,
        adresa:        input.personalData.adresa,
        postanskiBroj: input.personalData.postanskiBroj,
        mesto:         input.personalData.mesto,
        drzava:        input.personalData.drzava,
      },
      services: input.services.map((s) => ({
        serviceId:    s.serviceId,
        slotDatetime: s.slotDatetime,
      })),
      currency:      input.currency,
      promoCode:     input.promoCode,
      priceBreakdown,
    };

    await reservationRepository.create({
      correlationId,
      sifra:               '',
      status:              ReservationStatus.PENDING,
      ime:                 input.personalData.ime,
      prezime:             input.personalData.prezime,
      email:               input.personalData.email,
      adresa:              input.personalData.adresa,
      postanskiBroj:       input.personalData.postanskiBroj,
      mesto:               input.personalData.mesto,
      drzava:              input.personalData.drzava,
      currency:            input.currency,
      exchangeRate:        priceBreakdown.exchangeRate,
      basePriceRsd:        priceBreakdown.basePriceRsd,
      discountAmountRsd:   priceBreakdown.discountAmountRsd,
      discountType:        priceBreakdown.discountType,
      finalPriceRsd:       priceBreakdown.finalPriceRsd,
      finalPriceForeign:   priceBreakdown.finalPriceForeign,
      promoCodeApplied:    priceBreakdown.promoCodeApplied
        ? input.promoCode
        : undefined,
      promoRejectionReason: !priceBreakdown.promoCodeApplied && input.promoCode
        ? priceBreakdown.promoCodeMessage
        : undefined,
      services: input.services.map((s) => {
        const svc = services.find((sv) => sv.id === s.serviceId)!;
        return {
          serviceId:        s.serviceId,
          slotDatetime:     new Date(s.slotDatetime),
          priceSnapshotRsd: Number(svc.cenaRsd),
        };
      }),
    });

    await rabbitMQPublisher.publish(
      ROUTING_KEYS.RESERVATION_PENDING,
      message,
    );

    return {
      correlationId,
      message:       'Rezervacija je primljena i obrađuje se. Koristite correlationId za provjeru statusa.',
      priceBreakdown,
    };
  }

  async getReservationStatus(
    correlationId: string,
  ): Promise<ReservationStatusResponse> {

    const reservation = await reservationRepository.findByCorrelationId(correlationId);

    if (!reservation) {
      throw new Error('Rezervacija sa datim correlationId nije pronađena');
    }

    if (reservation.status === ReservationStatus.PENDING) {
      return {
        correlationId,
        status:  'PENDING',
        message: 'Rezervacija se još obrađuje...',
      };
    }

    if (reservation.status === ReservationStatus.FAILED) {
      return {
        correlationId,
        status:  'FAILED',
        message: 'Rezervacija nije uspela. Pokušajte ponovo.',
      };
    }

    const full = await reservationRepository.findBySifraAndEmail(
      reservation.sifra ?? '',
      reservation.email,
    );

    return {
      correlationId,
      status:    reservation.status,
      sifra:     reservation.sifra ?? undefined,
      promoCode: (reservation as any).generatedPromoCode?.code ?? undefined,
      priceBreakdown: {
        finalPriceRsd:     Number(reservation.finalPriceRsd),
        finalPriceForeign: Number(reservation.finalPriceForeign),
        currency:          reservation.currency,
        discountType:      reservation.discountType,
        discountAmountRsd: Number(reservation.discountAmountRsd),
      },
      services: full?.reservationServices.map((rs) => ({
        serviceId:        rs.serviceId,
        serviceNaziv:     rs.service.naziv,
        categoryNaziv:    rs.service.category.naziv,
        slotDatetime:     rs.slotDatetime.toISOString(),
        priceSnapshotRsd: Number(rs.priceSnapshotRsd),
      })),
    };
  }

  async calculatePrice(input: CalculatePriceDTO): Promise<PriceBreakdown> {
    const currency = await allowedCurrencyRepository.findByCode(input.currency);
    if (!currency || !currency.isActive) {
      throw new Error(`Valuta ${input.currency} nije dozvoljena`);
    }

    return priceCalculationService.calculate({
      serviceIds: input.serviceIds,
      currency:   input.currency,
      promoCode:  input.promoCode,
    });
  }

  async getAvailableSlots(
    serviceId: number,
    dateStr:   string,
  ): Promise<TimeSlot[]> {
    const service = await serviceRepository.findById(serviceId);
    if (!service) throw new Error(`Usluga ${serviceId} nije pronađena`);

    const date = new Date(dateStr);
    return slotAvailabilityService.getAvailableSlots(serviceId, date);
  }

  async getReservationByCredentials(sifra: string, email: string) {
    const reservation = await reservationRepository.findBySifraAndEmail(
      sifra.toUpperCase(),
      email.toLowerCase(),
    );

    if (!reservation) {
      throw new Error('Rezervacija nije pronađena ili su podaci neispravni');
    }

    return reservation;
  }

  async addService(input: AddServiceInput): Promise<ModifyReservationResponse> {

    const reservation = await reservationRepository.findBySifraAndEmail(
      input.sifra.toUpperCase(),
      input.email.toLowerCase(),
    );

    if (!reservation) throw new Error('Rezervacija nije pronađena');
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new Error('Samo potvrđene rezervacije mogu biti izmenjene');
    }

    const service = await serviceRepository.findById(input.serviceId);
    if (!service) throw new Error('Usluga nije pronađena');

    const slotDatetime = new Date(input.slotDatetime);
    const slotAvailable = await slotAvailabilityService.checkSlotAvailable(
      input.serviceId,
      slotDatetime,
    );
    if (!slotAvailable) throw new Error('Izabrani termin nije dostupan');

    await reservationRepository.addService(
      reservation.id,
      input.serviceId,
      slotDatetime,
      Number(service.cenaRsd),
    );

    const existingServiceIds = reservation.reservationServices.map(
      (rs) => rs.serviceId,
    );
    const allServiceIds = [...existingServiceIds, input.serviceId];

    const newPrice = await priceCalculationService.calculate({
      serviceIds: allServiceIds,
      currency:   reservation.currency,
      promoCode:  reservation.promoCodeApplied ?? undefined,
    });

    await reservationRepository.update(reservation.id, {
      basePriceRsd:      newPrice.basePriceRsd,
      discountAmountRsd: newPrice.discountAmountRsd,
      discountType:      newPrice.discountType,
      finalPriceRsd:     newPrice.finalPriceRsd,
      finalPriceForeign: newPrice.finalPriceForeign,
    });

    const event: ReservationUpdatedEvent = {
      eventId:             uuidv4(),
      eventType:           'reservation.updated',
      timestamp:           new Date().toISOString(),
      sourceReservationId: reservation.id,
      finalPriceRsd:       newPrice.finalPriceRsd,
      finalPriceForeign:   newPrice.finalPriceForeign,
      discountAmountRsd:   newPrice.discountAmountRsd,
      discountType:        newPrice.discountType,
      updatedAt:           new Date().toISOString(),
    };

    await rabbitMQPublisher.publish(ROUTING_KEYS.RESERVATION_UPDATED, event);

    return {
      success:        true,
      message:        `Usluga "${service.naziv}" uspešno dodana`,
      priceBreakdown: newPrice,
    };
  }

  async removeService(input: RemoveServiceInput): Promise<ModifyReservationResponse> {

    const reservation = await reservationRepository.findBySifraAndEmail(
      input.sifra.toUpperCase(),
      input.email.toLowerCase(),
    );

    if (!reservation) throw new Error('Rezervacija nije pronađena');
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new Error('Samo potvrđene rezervacije mogu biti izmenjene');
    }

    const slotDatetime  = new Date(input.slotDatetime);
    const serviceInRes  = reservation.reservationServices.find(
      (rs) =>
        rs.serviceId === input.serviceId &&
        rs.slotDatetime.toISOString() === slotDatetime.toISOString(),
    );

    if (!serviceInRes) {
      throw new Error('Usluga nije pronađena u ovoj rezervaciji');
    }

    if (reservation.reservationServices.length <= 1) {
      throw new Error(
        'Ne možete ukloniti jedinu uslugu iz rezervacije. Koristite otkazivanje rezervacije.',
      );
    }

    await reservationRepository.removeService(
      reservation.id,
      input.serviceId,
      slotDatetime,
    );

    const remainingServiceIds = reservation.reservationServices
      .filter(
        (rs) =>
          !(rs.serviceId === input.serviceId &&
            rs.slotDatetime.toISOString() === slotDatetime.toISOString()),
      )
      .map((rs) => rs.serviceId);

    const newPrice = await priceCalculationService.calculate({
      serviceIds: remainingServiceIds,
      currency:   reservation.currency,
      promoCode:  reservation.promoCodeApplied ?? undefined,
    });

    await reservationRepository.update(reservation.id, {
      basePriceRsd:      newPrice.basePriceRsd,
      discountAmountRsd: newPrice.discountAmountRsd,
      discountType:      newPrice.discountType,
      finalPriceRsd:     newPrice.finalPriceRsd,
      finalPriceForeign: newPrice.finalPriceForeign,
    });

    const event: ReservationUpdatedEvent = {
      eventId:             uuidv4(),
      eventType:           'reservation.updated',
      timestamp:           new Date().toISOString(),
      sourceReservationId: reservation.id,
      finalPriceRsd:       newPrice.finalPriceRsd,
      finalPriceForeign:   newPrice.finalPriceForeign,
      discountAmountRsd:   newPrice.discountAmountRsd,
      discountType:        newPrice.discountType,
      updatedAt:           new Date().toISOString(),
    };

    await rabbitMQPublisher.publish(ROUTING_KEYS.RESERVATION_UPDATED, event);

    const service = await serviceRepository.findById(input.serviceId);

    return {
      success:        true,
      message:        `Usluga "${service?.naziv ?? input.serviceId}" uspešno uklonjena`,
      priceBreakdown: newPrice,
    };
  }

  async cancelReservation(
    input: CancelReservationInput,
  ): Promise<{ success: boolean; message: string }> {

    const reservation = await reservationRepository.findBySifraAndEmail(
      input.sifra.toUpperCase(),
      input.email.toLowerCase(),
    );

    if (!reservation) throw new Error('Rezervacija nije pronađena');

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new Error('Rezervacija je već otkazana');
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new Error('Samo potvrđene rezervacije mogu biti otkazane');
    }

    await reservationRepository.cancel(reservation.id);

    await promoCodeService.deactivateForReservation(reservation.id);

    const event: ReservationCancelledEvent = {
      eventId:             uuidv4(),
      eventType:           'reservation.cancelled',
      timestamp:           new Date().toISOString(),
      sourceReservationId: reservation.id,
      cancelledAt:         new Date().toISOString(),
    };

    await rabbitMQPublisher.publish(ROUTING_KEYS.RESERVATION_CANCELLED, event);

    return {
      success: true,
      message: 'Rezervacija je uspešno otkazana',
    };
  }
}

export const reservationApplicationService = new ReservationApplicationService();
