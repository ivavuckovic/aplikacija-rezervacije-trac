export interface ApiResponse<T = void> {
  success: boolean;
  data?:   T;
  message?: string;
  errors?:  string[];
}

export interface TimeSlot {
  serviceId:      number;
  datetime:       Date;
  datetimeStr:    string;
  availableSpots: number;
  maxSpots:       number;
  isFull:         boolean;
}

export interface PriceBreakdown {
  basePriceRsd:       number;
  discountPercentage: number;
  discountAmountRsd:  number;
  discountType:       'NONE' | 'DATE_BASED' | 'PROMO_CODE' | 'BOTH';
  finalPriceRsd:      number;
  exchangeRate:       number;
  finalPriceForeign:  number;
  currency:           string;
  promoCodeApplied:   boolean;
  promoCodeMessage?:  string;
  isStaleRate:        boolean;
}

export interface ExchangeRateResult {
  base:     string;
  target:   string;
  rate:     number;
  isStale:  boolean;
  fetchedAt: string;
}

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
  priceBreakdown: PriceBreakdown;
}

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

export interface ReservationUpdatedEvent {
  eventId:             string;
  eventType:           'reservation.updated';
  timestamp:           string;
  sourceReservationId: number;
  finalPriceRsd:       number;
  finalPriceForeign:   number;
  discountAmountRsd:   number;
  discountType:        string;
  updatedAt:           string;
}

export interface ReservationCancelledEvent {
  eventId:             string;
  eventType:           'reservation.cancelled';
  timestamp:           string;
  sourceReservationId: number;
  cancelledAt:         string;
}
