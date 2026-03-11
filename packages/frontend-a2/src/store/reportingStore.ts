import { create } from 'zustand';
import { reportingService } from '../services/reportingService';
import type { ReportingSummary, CategoryStat, DailyStat, SyncStatus } from '../types';

interface ReportingState {
  summary: ReportingSummary | null;
  categoryStats: CategoryStat[];
  dailyStats: DailyStat[];
  syncStatus: SyncStatus | null;
  isLoading: boolean;
  error: string | null;
  lastRefreshed: Date | null;

  fetchSummary: () => Promise<void>;
  fetchCategoryStats: (realtime?: boolean) => Promise<void>;
  fetchDailyStats: (from: string, to: string, realtime?: boolean) => Promise<void>;
  fetchSyncStatus: () => Promise<void>;
  fetchAll: (realtime?: boolean) => Promise<void>;
  clearError: () => void;
}

export const useReportingStore = create<ReportingState>((set) => ({
  summary: null,
  categoryStats: [],
  dailyStats: [],
  syncStatus: null,
  isLoading: false,
  error: null,
  lastRefreshed: null,

  fetchSummary: async () => {
    try {
      set({ isLoading: true, error: null });
      const summary = await reportingService.getSummary();
      set({ summary, lastRefreshed: new Date() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greška pri učitavanju pregleda';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCategoryStats: async (realtime = false) => {
    try {
      set({ isLoading: true, error: null });
      const categoryStats = await reportingService.getCategoryStats(realtime);
      set({ categoryStats, lastRefreshed: new Date() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greška pri učitavanju statistike po kategorijama';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDailyStats: async (from: string, to: string, realtime = false) => {
    try {
      set({ isLoading: true, error: null });
      const dailyStats = await reportingService.getDailyStats(from, to, realtime);
      set({ dailyStats, lastRefreshed: new Date() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greška pri učitavanju dnevne statistike';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSyncStatus: async () => {
    try {
      const syncStatus = await reportingService.getSyncStatus();
      set({ syncStatus });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greška pri učitavanju statusa sinhronizacije';
      set({ error: message });
    }
  },

  fetchAll: async (realtime = false) => {
    try {
      set({ isLoading: true, error: null });
      const [summary, categoryStats, syncStatus] = await Promise.all([
        reportingService.getSummary(),
        reportingService.getCategoryStats(realtime),
        reportingService.getSyncStatus(),
      ]);
      set({
        summary,
        categoryStats,
        syncStatus,
        lastRefreshed: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greška pri učitavanju podataka';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
