import { api } from './api';
import type {
  ServiceCategory,
  Service,
  AllowedCurrency,
  DiscountConfig,
  ApiResponse,
} from '../types';

export const adminService = {
  // ── Kategorije ──────────────────────────────────────────
  getCategories: async (): Promise<ServiceCategory[]> => {
    const { data } = await api.get<ApiResponse<ServiceCategory[]>>('/admin/categories');
    return data.data || [];
  },

  createCategory: async (payload: { naziv: string; opis?: string }): Promise<ServiceCategory> => {
    const { data } = await api.post<ApiResponse<ServiceCategory>>('/admin/categories', payload);
    if (!data.data) throw new Error('Nedostaju podaci kategorije');
    return data.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/admin/categories/${id}`);
  },

  // ── Usluge ──────────────────────────────────────────────
  getServices: async (): Promise<Service[]> => {
    const { data } = await api.get<ApiResponse<Service[]>>('/admin/services');
    return data.data || [];
  },

  createService: async (payload: {
    categoryId: number;
    naziv: string;
    opis?: string;
    trajanjeMin: number;
    maxKlijenataPoTerminu: number;
    vremePocetkaPrvogTermina: string;
    vremeZavrsetkaPoslednjeg: string;
    cenaRsd: number;
  }): Promise<Service> => {
    const { data } = await api.post<ApiResponse<Service>>('/admin/services', payload);
    if (!data.data) throw new Error('Nedostaju podaci usluge');
    return data.data;
  },

  deleteService: async (id: number): Promise<void> => {
    await api.delete(`/admin/services/${id}`);
  },

  // ── Valute ──────────────────────────────────────────────
  getCurrencies: async (): Promise<AllowedCurrency[]> => {
    const { data } = await api.get<ApiResponse<AllowedCurrency[]>>('/admin/currencies');
    return data.data || [];
  },

  createCurrency: async (payload: { code: string; naziv: string }): Promise<AllowedCurrency> => {
    const { data } = await api.post<ApiResponse<AllowedCurrency>>('/admin/currencies', payload);
    if (!data.data) throw new Error('Nedostaju podaci valute');
    return data.data;
  },

  toggleCurrency: async (code: string, isActive: boolean): Promise<AllowedCurrency> => {
    const { data } = await api.patch<ApiResponse<AllowedCurrency>>(`/admin/currencies/${code}/toggle`, { isActive });
    if (!data.data) throw new Error('Nedostaju podaci valute');
    return data.data;
  },

  // ── Popusti ─────────────────────────────────────────────
  getDiscountConfig: async (): Promise<DiscountConfig> => {
    const { data } = await api.get<ApiResponse<DiscountConfig>>('/admin/discount-config');
    if (!data.data) throw new Error('Nedostaju podaci o popustu');
    return data.data;
  },

  updateDiscountConfig: async (payload: { discountPercentage: number; validUntil: string }): Promise<DiscountConfig> => {
    const { data } = await api.put<ApiResponse<DiscountConfig>>('/admin/discount-config', payload);
    if (!data.data) throw new Error('Nedostaju podaci o popustu');
    return data.data;
  },
};
