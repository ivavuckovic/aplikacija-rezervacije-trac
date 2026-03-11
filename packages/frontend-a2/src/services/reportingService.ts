import api from './api';
import type { ReportingSummary, CategoryStat, DailyStat, PaginatedReservations, SyncStatus, ApiResponse } from '../types';

export const reportingService = {
  async getSummary(): Promise<ReportingSummary> {
    const response = await api.get<ApiResponse<ReportingSummary>>('/reports/summary');
    if (!response.data.data) throw new Error('Failed to fetch summary');
    return response.data.data;
  },

  async getCategoryStats(realtime = false): Promise<CategoryStat[]> {
    const response = await api.get<ApiResponse<CategoryStat[]>>('/reports/by-category', {
      params: { realtime: realtime ? 'true' : 'false' },
    });
    if (!response.data.data) throw new Error('Failed to fetch category stats');
    return response.data.data;
  },

  async getDailyStats(from: string, to: string, realtime = false): Promise<DailyStat[]> {
    const response = await api.get<ApiResponse<DailyStat[]>>('/reports/by-date', {
      params: { from, to, realtime: realtime ? 'true' : 'false' },
    });
    if (!response.data.data) throw new Error('Failed to fetch daily stats');
    return response.data.data;
  },

  async getReservations(page: number, limit: number, status?: string): Promise<PaginatedReservations> {
    const response = await api.get<ApiResponse<PaginatedReservations>>('/reports/reservations', {
      params: { page, limit, ...(status && { status }) },
    });
    if (!response.data.data) throw new Error('Failed to fetch reservations');
    return response.data.data;
  },

  async getSyncStatus(): Promise<SyncStatus> {
    const response = await api.get<ApiResponse<SyncStatus>>('/reports/sync-status');
    if (!response.data.data) throw new Error('Failed to fetch sync status');
    return response.data.data;
  },
};
