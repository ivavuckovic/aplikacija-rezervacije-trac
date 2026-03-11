// ── Poruka koja stiže iz backend-a1 ──────────────────
export interface ReservationMessage {
  correlationId: string;
  timestamp:     string;
  personalData: {
    ime:           string;
    prezime:       string;
    email:         string;
    adresa:        string;
    postanskiBroj: string;
    mesto:         string;
    drzava:        string;
  };
  services: {
    serviceId:    number;
    slotDatetime: string;
  }[];
  currency:      string;
  promoCode?:    string;
  priceBreakdown: {
    basePriceRsd:       number;
    discountAmountRsd:  number;
    discountType:       string;
    finalPriceRsd:      number;
    exchangeRate:       number;
    finalPriceForeign:  number;
    currency:           string;
    promoCodeApplied:   boolean;
    promoCodeMessage?:  string;
    isStaleRate:        boolean;
  };
}

// ── Event koji Worker publish-uje ka A.2 ──────────────
export interface ReservationCreatedEvent {
  eventId:             string;
  eventType:           'reservation.created';
  timestamp:           string;
  sourceReservationId: number;
  correlationId:       string;
  email:               string;
  currency:            string;
  finalPriceRsd:       number;
  finalPriceForeign:   number;
  discountType:        string;
  discountAmountRsd:   number;
  promoCodeApplied?:   string;
  createdAt:           string;
  services: {
    serviceId:        number;
    serviceNaziv:     string;
    categoryId:       number;
    categoryNaziv:    string;
    slotDatetime:     string;
    priceSnapshotRsd: number;
  }[];
}

export interface ReservationFailedEvent {
  eventId:       string;
  eventType:     'reservation.failed';
  timestamp:     string;
  correlationId: string;
  reason:        string;
}

// ── Rezultat validacije ───────────────────────────────
export interface ValidationResult {
  valid:   boolean;
  reason?: string;
}

// ── Routing keys ──────────────────────────────────────
export const ROUTING_KEYS = {
  RESERVATION_PENDING:   'reservation.pending',
  RESERVATION_CREATED:   'reservation.created',
  RESERVATION_UPDATED:   'reservation.updated',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  RESERVATION_FAILED:    'reservation.failed',
} as const;

export const EXCHANGE_NAME  = 'salon.events';
export const PENDING_QUEUE  = 'reservation.pending.queue';
export const DEAD_LETTER_EXCHANGE = 'salon.events.dlx';
export const DEAD_LETTER_QUEUE    = 'reservation.failed.queue';
