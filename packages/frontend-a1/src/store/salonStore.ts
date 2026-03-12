import { create }      from 'zustand';
import { salonService }    from '../services/salonService';
import { servicesService } from '../services/servicesService';
import type { SalonInfo, ServiceCategory } from '../types';

interface SalonState {
  // State
  salonInfo:   SalonInfo | null;
  categories:  ServiceCategory[];
  isLoading:   boolean;
  error:       string | null;

  // Actions
  fetchSalonInfo:  () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchAll:        () => Promise<void>;
  clearError:      () => void;
}

export const useSalonStore = create<SalonState>((set, _get) => ({
  salonInfo:  null,
  categories: [],
  isLoading:  false,
  error:      null,

  fetchSalonInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await salonService.getSalonInfo();
      set({ salonInfo: info, isLoading: false });
    } catch (err) {
      set({
        error:     err instanceof Error ? err.message : 'Greška pri dohvatanju podataka',
        isLoading: false,
      });
    }
  },

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const cats = await servicesService.getAllByCategory();
      set({ categories: cats, isLoading: false });
    } catch (err) {
      set({
        error:     err instanceof Error ? err.message : 'Greška pri dohvatanju usluga',
        isLoading: false,
      });
    }
  },

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [info, cats] = await Promise.all([
        salonService.getSalonInfo(),
        servicesService.getAllByCategory(),
      ]);
      set({ salonInfo: info, categories: cats, isLoading: false });
    } catch (err) {
      set({
        error:     err instanceof Error ? err.message : 'Greška',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
