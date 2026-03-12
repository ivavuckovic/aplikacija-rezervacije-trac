// ── Salon Info ─────────────────────────────────────
export interface SalonInfo {
  id:           number;
  naziv:        string;
  lokacija:     string;
  opis:         string;
  radnoVremeOd: string;
  radnoVremeDo: string;
  updatedAt:    string;
}

// ── Kategorije i Usluge ────────────────────────
export interface Service {
  id:                       number;
  naziv:                    string;
  opis:                     string | null;
  trajanjeMin:              number;
  maxKlijenataPoTerminu:    number;
  vremePocetkaPrvogTermina: string;
  vremeZavrsetkaPoslednjeg: string;
  cenaRsd:                  number;
}

export interface ServiceCategory {
  id:       number;
  naziv:    string;
  opis:     string | null;
  services: Service[];
}

export interface ServiceWithCategory extends Service {
  categoryId:    number;
  categoryNaziv: string;
}

// ── Termini ─────────────────────────────────────────
export interface TimeSlot {
  serviceId:      number;
  datetime:       string;
  datetimeStr:    string;
  availableSpots: number;
  maxSpots:       number;
  isFull:         boolean;
}

// ── Valute i Kursevi ────────────────────────────
export interface AllowedCurrency {
  id:       number;
  code:     string;
  naziv:    string;
  isActive: boolean;
}

export interface ExchangeRate {
  base:      string;
  target:    string;
  rate:      number;
  isStale:   boolean;
  fetchedAt: string;
}

// ── Rezervacija ─────────────────────────────────
export interface PersonalData {
  ime:           string;
  prezime:       string;
  email:         string;
  adresa:        string;
  postanskiBroj: string;
  mesto:         string;
  drzava:        string;
}

export interface ServiceSelection {
  serviceId:    number;
  slotDatetime: string;
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

export interface ReservationResponse {
  correlationId:  string;
  message:        string;
  priceBreakdown: PriceBreakdown;
}

export interface ReservationStatus {
  correlationId:  string;
  status:         'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
  sifra?:         string;
  promoCode?:     string;
  priceBreakdown?: {
    finalPriceRsd:     number;
    finalPriceForeign: number;
    currency:          string;
    discountType:      string;
    discountAmountRsd: number;
  };
  services?: ReservationServiceItem[];
  message?:   string;
}

export interface ReservationServiceItem {
  serviceId:        number;
  serviceNaziv:     string;
  categoryNaziv:    string;
  slotDatetime:     string;
  priceSnapshotRsd: number;
}

export interface ReservationDetail {
  id:                number;
  status:            string;
  sifra:             string;
  ime:               string;
  prezime:           string;
  email:             string;
  adresa:            string;
  postanskiBroj:     string;
  mesto:             string;
  drzava:            string;
  currency:          string;
  basePriceRsd:      number;
  discountAmountRsd: number;
  discountType:      string;
  finalPriceRsd:     number;
  finalPriceForeign: number;
  promoCodeApplied:  string | null;
  createdAt:         string;
  promoCode?:        string;
  services:          ReservationServiceItem[];
}

// ── Multi-step forma state ──────────────────────────
export interface ReservationFormState {
  step:          1 | 2 | 3 | 4;
  personalData:  Partial<PersonalData>;
  selections:    ServiceSelection[];
  currency:      string;
  promoCode:     string;
  priceBreakdown: PriceBreakdown | null;
  correlationId: string | null;
  confirmed:     ReservationStatus | null;
}

// ── API Response wrapper ────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  message?: string;
  errors?:  string[];
  warning?: string;
}

// ── Admin Tipovi ────────────────────────────────────
export interface DiscountConfig {
  id:                 number;
  discountPercentage: string | number;
  validUntil:         string;
  isActive:           boolean;
}
