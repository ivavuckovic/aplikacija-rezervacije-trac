import { api } from './api';
import type {
  PersonalData,
  ServiceSelection,
  PriceBreakdown,
  ReservationResponse,
  ReservationStatus,
  ReservationDetail,
  AllowedCurrency,
  ExchangeRate,
  ApiResponse,
} from '../types';

export const reservationService = {

  // Dohvati dozvoljene valute
  async getAllowedCurrencies(): Promise<AllowedCurrency[]> {
    const res = await api.get<ApiResponse<AllowedCurrency[]>>(
      '/exchange-rate/allowed-currencies',
    );
    return res.data.data ?? [];
  },

  // Dohvati kurs valute
  async getExchangeRate(
    target: string,
    base:   string = 'RSD',
  ): Promise<ExchangeRate> {
    const res = await api.get<ApiResponse<ExchangeRate> & { warning?: string }>(
      '/exchange-rate',
      { params: { target, base } },
    );
    return res.data.data!;
  },

  // Preview cijene (bez kreiranja rezervacije)
  async calculatePrice(
    serviceIds: number[],
    currency:   string,
    promoCode?: string,
  ): Promise<PriceBreakdown> {
    const res = await api.post<ApiResponse<PriceBreakdown>>(
      '/reservations/calculate-price',
      { serviceIds, currency, promoCode },
    );
    return res.data.data!;
  },

  // Inicira rezervaciju → 202 Accepted
  async create(
    personalData: PersonalData,
    services:     ServiceSelection[],
    currency:     string,
    promoCode?:   string,
  ): Promise<ReservationResponse> {
    const res = await api.post<ApiResponse<ReservationResponse>>(
      '/reservations',
      { personalData, services, currency, promoCode },
    );
    return res.data.data!;
  },

  // Polling status
  async getStatus(correlationId: string): Promise<ReservationStatus> {
    const res = await api.get<ApiResponse<ReservationStatus>>(
      `/reservations/status/${correlationId}`,
    );
    return res.data.data!;
  },

  // Dohvati detalje po šifri + email
  async getByCredentials(
    sifra: string,
    email: string,
  ): Promise<ReservationDetail> {
    const res = await api.get<ApiResponse<ReservationDetail>>(
      '/reservations/my',
      { params: { sifra, email } },
    );
    return res.data.data!;
  },

  // Dodaj uslugu
  async addService(
    sifra:        string,
    email:        string,
    serviceId:    number,
    slotDatetime: string,
  ): Promise<{ message: string; priceBreakdown: PriceBreakdown }> {
    const res = await api.post<ApiResponse<{ message: string; priceBreakdown: PriceBreakdown }>>(
      '/reservations/add-service',
      { sifra, email, serviceId, slotDatetime },
    );
    return res.data.data!;
  },

  // Ukloni uslugu
  async removeService(
    sifra:        string,
    email:        string,
    serviceId:    number,
    slotDatetime: string,
  ): Promise<{ message: string; priceBreakdown: PriceBreakdown }> {
    const res = await api.post<ApiResponse<{ message: string; priceBreakdown: PriceBreakdown }>>(
      '/reservations/remove-service',
      { sifra, email, serviceId, slotDatetime },
    );
    return res.data.data!;
  },

  // Otkaži rezervaciju
  async cancel(
    sifra: string,
    email: string,
  ): Promise<{ message: string }> {
    const res = await api.post<ApiResponse<{ message: string }>>(
      '/reservations/cancel',
      { sifra, email },
    );
    return res.data.data!;
  },
};
