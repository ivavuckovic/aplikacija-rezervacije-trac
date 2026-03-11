export interface CategoryStat {
  categoryId: number;
  categoryNaziv: string;
  totalSlots: number;
  totalPrice: number;
  reservationCount: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  totalSlots: number;
  totalPrice: number;
  reservationCount: number;
  avgPricePerSlot: number;
}

export interface ReportingSummary {
  totalReservations: number;
  totalRevenue: number;
  totalSlots: number;
  avgPricePerSlot: number;
  topCategory: string;
  topCategoryCount: number;
}

export interface ReservationReportItem {
  id: number;
  sifra: string;
  ime: string;
  prezime: string;
  email: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  createdAt: string;
  totalPrice: number;
  slotsCount: number;
}

export interface PaginatedReservations {
  items: ReservationReportItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SyncStatus {
  lastSyncAt: string;
  eventsProcessed: number;
  error?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
}
