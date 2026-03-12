// ── MQ Events koji stižu iz A.1 ──────────────────────

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

export type SalonEvent =
  | ReservationCreatedEvent
  | ReservationUpdatedEvent
  | ReservationCancelledEvent;

// ── Reporting Response tipovi ─────────────────────────

export interface CategoryStatRow {
  categoryId:       number;
  categoryNaziv:    string;
  totalBookedSlots: number;
  totalRevenueRsd:  number;
}

export interface DailyStatRow {
  date:              string;
  totalReservations: number;
  totalRevenueRsd:   number;
}

export interface ReportingSummary {
  totalReservations: number;
  totalRevenue:      number;
  totalSlots:        number;
  avgPricePerSlot:   number;
  topCategory:       string;
  topCategoryCount:  number;
}

// ── RabbitMQ ─────────────────────────────────────────

export const EXCHANGE_NAME = 'salon.events';

export const REPORTING_QUEUES = {
  CREATED:   'reservation.created.reporting',
  UPDATED:   'reservation.updated.reporting',
  CANCELLED: 'reservation.cancelled.reporting',
} as const;

export const ROUTING_KEYS = {
  CREATED:   'reservation.created',
  UPDATED:   'reservation.updated',
  CANCELLED: 'reservation.cancelled',
} as const;
