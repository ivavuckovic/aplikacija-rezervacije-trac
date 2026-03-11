import {
  Reservation,
  ReservationService,
  ReservationStatus,
} from '../../../generated/prisma';

export interface CreateReservationData {
  correlationId:        string;
  sifra:                string;
  status:               ReservationStatus;
  ime:                  string;
  prezime:              string;
  email:                string;
  adresa:               string;
  postanskiBroj:        string;
  mesto:                string;
  drzava:               string;
  currency:             string;
  exchangeRate:         number;
  basePriceRsd:         number;
  discountAmountRsd:    number;
  discountType:         string;
  finalPriceRsd:        number;
  finalPriceForeign:    number;
  promoCodeApplied?:    string;
  promoRejectionReason?: string;
  services: {
    serviceId:        number;
    slotDatetime:     Date;
    priceSnapshotRsd: number;
  }[];
}

export interface UpdateReservationData {
  status?:             ReservationStatus;
  sifra?:              string;
  discountAmountRsd?:  number;
  discountType?:       string;
  finalPriceRsd?:      number;
  finalPriceForeign?:  number;
  promoCodeApplied?:   string;
}

export type ReservationWithServices = Reservation & {
  reservationServices: (ReservationService & {
    service: {
      id:      number;
      naziv:   string;
      cenaRsd: any;
      category: { id: number; naziv: string };
    };
  })[];
};

export interface IReservationRepository {
  findById(id: number): Promise<Reservation | null>;

  findByCorrelationId(correlationId: string): Promise<Reservation | null>;

  findBySifraAndEmail(
    sifra: string,
    email: string,
  ): Promise<ReservationWithServices | null>;

  create(data: CreateReservationData): Promise<Reservation>;

  update(id: number, data: UpdateReservationData): Promise<Reservation>;

  addService(
    reservationId:    number,
    serviceId:        number,
    slotDatetime:     Date,
    priceSnapshotRsd: number,
  ): Promise<ReservationService>;

  removeService(
    reservationId: number,
    serviceId:     number,
    slotDatetime:  Date,
  ): Promise<void>;

  cancel(id: number): Promise<Reservation>;

  createError(
    correlationId: string,
    reason:        string,
    payload?:      object,
  ): Promise<void>;

  countConfirmedForSlot(serviceId: number, slotDatetime: Date): Promise<number>;
}
