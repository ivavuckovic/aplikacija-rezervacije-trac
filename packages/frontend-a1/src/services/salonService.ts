import { api }          from './api';
import type { SalonInfo, ApiResponse } from '../types';

export const salonService = {
  async getSalonInfo(): Promise<SalonInfo> {
    const res = await api.get<ApiResponse<SalonInfo>>('/salon-info');
    if (!res.data.data) throw new Error('Nema podataka o salonu');
    return res.data.data;
  },
};
