import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PersonalData,
  ServiceSelection,
  PriceBreakdown,
  ReservationStatus,
  ReservationDetail,
} from '../types';

interface ReservationState {
  // Multi-step forma
  step:           1 | 2 | 3 | 4;
  personalData:   Partial<PersonalData>;
  selections:     ServiceSelection[];
  currency:       string;
  promoCode:      string;
  priceBreakdown: PriceBreakdown | null;
  correlationId:  string | null;
  confirmed:      ReservationStatus | null;

  // Izmena/otkazivanje
  activeReservation: ReservationDetail | null;

  // Actions
  setStep:            (step: 1 | 2 | 3 | 4) => void;
  setPersonalData:    (data: Partial<PersonalData>) => void;
  addSelection:       (sel: ServiceSelection) => void;
  removeSelection:    (serviceId: number, slot: string) => void;
  setCurrency:        (currency: string) => void;
  setPromoCode:       (code: string) => void;
  setPriceBreakdown:  (pb: PriceBreakdown | null) => void;
  setCorrelationId:   (id: string) => void;
  setConfirmed:       (status: ReservationStatus) => void;
  setActiveReservation: (r: ReservationDetail | null) => void;
  resetForm:          () => void;
}

const INITIAL_STATE = {
  step:              1 as const,
  personalData:      {},
  selections:        [],
  currency:          'RSD',
  promoCode:         '',
  priceBreakdown:    null,
  correlationId:     null,
  confirmed:         null,
  activeReservation: null,
};

export const useReservationStore = create<ReservationState>()(
  persist(
    (set, _get) => ({
      ...INITIAL_STATE,

      setStep: (step) => set({ step }),

      setPersonalData: (data) =>
        set((state) => ({
          personalData: { ...state.personalData, ...data },
        })),

      addSelection: (sel) =>
        set((state) => {
          // Provjeri duplikat
          const exists = state.selections.some(
            (s) =>
              s.serviceId    === sel.serviceId &&
              s.slotDatetime === sel.slotDatetime,
          );
          if (exists) return state;
          return { selections: [...state.selections, sel] };
        }),

      removeSelection: (serviceId, slot) =>
        set((state) => ({
          selections: state.selections.filter(
            (s) => !(s.serviceId === serviceId && s.slotDatetime === slot),
          ),
        })),

      setCurrency:       (currency)       => set({ currency }),
      setPromoCode:      (promoCode)      => set({ promoCode }),
      setPriceBreakdown: (priceBreakdown) => set({ priceBreakdown }),
      setCorrelationId:  (correlationId)  => set({ correlationId }),
      setConfirmed:      (confirmed)      => set({ confirmed }),
      setActiveReservation: (activeReservation) => set({ activeReservation }),

      resetForm: () => set({ ...INITIAL_STATE }),
    }),
    {
      name:        'trac-reservation',
      partialize:  (state) => ({
        correlationId: state.correlationId,
        confirmed:     state.confirmed,
      }),
    },
  ),
);
