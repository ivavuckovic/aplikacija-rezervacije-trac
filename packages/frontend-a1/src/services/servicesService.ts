import { api }  from './api';
import type {
  ServiceCategory,
  ServiceWithCategory,
  TimeSlot,
  ApiResponse,
} from '../types';

export const servicesService = {

  async getAllByCategory(): Promise<ServiceCategory[]> {
    const res = await api.get<ApiResponse<ServiceCategory[]>>('/services');
    return res.data.data ?? [];
  },

  async getById(id: number): Promise<ServiceWithCategory> {
    const res = await api.get<ApiResponse<ServiceWithCategory>>(`/services/${id}`);
    if (!res.data.data) throw new Error('Usluga nije pronađena');
    return res.data.data;
  },

  async getAvailableSlots(
    serviceId: number,
    date:      string,
  ): Promise<TimeSlot[]> {
    const res = await api.get<ApiResponse<{ serviceId: number; date: string; slots: TimeSlot[] }>>(
      `/services/${serviceId}/available-slots`,
      { params: { date } },
    );
    return res.data.data?.slots ?? [];
  },
};
