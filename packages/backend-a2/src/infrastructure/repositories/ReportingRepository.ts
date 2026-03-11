import { prisma } from '../../database/prismaClient';
import type {
  ReservationCreatedEvent,
  ReservationUpdatedEvent,
  CategoryStatRow,
  DailyStatRow,
  ReportingSummary,
} from '../../types';

export class ReportingRepository {

  // ════════════════════════════════════════════════════
  //  IDEMPOTENTNOST — da li je event već obrađen
  // ════════════════════════════════════════════════════
  async isEventProcessed(eventId: string): Promise<boolean> {
    const existing = await prisma.syncEvent.findUnique({
      where:  { eventId },
      select: { id: true },
    });
    return existing !== null;
  }

  async markEventProcessed(
    eventId:             string,
    eventType:           string,
    sourceReservationId: number,
    payload:             object,
    status:              'SUCCESS' | 'ERROR' = 'SUCCESS',
    errorMessage?:       string,
  ): Promise<void> {
    await prisma.syncEvent.create({
      data: {
        eventId,
        eventType,
        sourceReservationId,
        payload,
        status,
        errorMessage,
      },
    });
  }

  // ════════════════════════════════════════════════════
  //  RESERVATION CREATED — puni sve tabele
  // ════════════════════════════════════════════════════
  async handleCreated(event: ReservationCreatedEvent): Promise<void> {
    await prisma.$transaction(async (tx) => {

      // 1. Upsert categories_snapshot za svaku kategoriju u eventu
      const uniqueCategories = [
        ...new Map(
          event.services.map((s) => [
            s.categoryId,
            { id: s.categoryId, naziv: s.categoryNaziv },
          ]),
        ).values(),
      ];

      for (const cat of uniqueCategories) {
        await tx.categorySnapshot.upsert({
          where:  { sourceCategoryId: cat.id },
          update: { naziv: cat.naziv, lastSyncedAt: new Date() },
          create: { sourceCategoryId: cat.id, naziv: cat.naziv },
        });
      }

      // 2. INSERT reservations_report
      const report = await tx.reservationReport.create({
        data: {
          sourceReservationId: event.sourceReservationId,
          correlationId:       event.correlationId,
          status:              'CONFIRMED',
          email:               event.email,
          currency:            event.currency,
          finalPriceRsd:       event.finalPriceRsd,
          finalPriceForeign:   event.finalPriceForeign,
          discountType:        event.discountType,
          discountAmountRsd:   event.discountAmountRsd,
          promoCodeApplied:    event.promoCodeApplied,
          createdAt:           new Date(event.createdAt),
          updatedAt:           new Date(event.createdAt),
        },
      });

      // 3. INSERT reservation_services_report (svaka usluga posebno)
      if (event.services.length > 0) {
        await tx.reservationServiceReport.createMany({
          data: event.services.map((s) => ({
            reservationReportId: report.id,
            sourceServiceId:     s.serviceId,
            serviceNaziv:        s.serviceNaziv,
            categoryId:          s.categoryId,
            categoryNaziv:       s.categoryNaziv,
            slotDatetime:        new Date(s.slotDatetime),
            priceSnapshotRsd:    s.priceSnapshotRsd,
          })),
        });
      }

      // 4. UPSERT daily_stats
      const statDate = new Date(event.createdAt);
      statDate.setHours(0, 0, 0, 0);

      const existingDaily = await tx.dailyStats.findUnique({
        where: { statDate },
      });

      if (existingDaily) {
        await tx.dailyStats.update({
          where: { statDate },
          data: {
            totalReservations: { increment: 1 },
            totalRevenueRsd:   { increment: event.finalPriceRsd },
          },
        });
      } else {
        await tx.dailyStats.create({
          data: {
            statDate,
            totalReservations: 1,
            totalRevenueRsd:   event.finalPriceRsd,
          },
        });
      }

      // 5. UPSERT category_stats (za svaku kategoriju u eventu)
      for (const cat of uniqueCategories) {
        const slotsForCategory = event.services.filter(
          (s) => s.categoryId === cat.id,
        ).length;

        const revenueForCategory = event.services
          .filter((s) => s.categoryId === cat.id)
          .reduce((sum, s) => sum + s.priceSnapshotRsd, 0);

        const existingCat = await tx.categoryStats.findUnique({
          where: { categoryId: cat.id },
        });

        if (existingCat) {
          await tx.categoryStats.update({
            where: { categoryId: cat.id },
            data: {
              totalBookedSlots: { increment: slotsForCategory },
              totalRevenueRsd:  { increment: revenueForCategory },
              categoryNaziv:    cat.naziv,
            },
          });
        } else {
          await tx.categoryStats.create({
            data: {
              categoryId:       cat.id,
              categoryNaziv:    cat.naziv,
              totalBookedSlots: slotsForCategory,
              totalRevenueRsd:  revenueForCategory,
            },
          });
        }
      }
    });
  }

  // ════════════════════════════════════════════════════
  //  RESERVATION UPDATED — ažurira cijene u report tabeli
  // ════════════════════════════════════════════════════
  async handleUpdated(event: ReservationUpdatedEvent): Promise<void> {
    const existing = await prisma.reservationReport.findUnique({
      where: { sourceReservationId: event.sourceReservationId },
    });

    if (!existing) {
      console.warn(
        `⚠  [A.2] ReservationReport not found for source ID: ${event.sourceReservationId}`,
      );
      return;
    }

    // Razlika u cijeni za korekciju daily_stats
    const priceDiff = event.finalPriceRsd - Number(existing.finalPriceRsd);

    await prisma.$transaction(async (tx) => {
      // Ažuriraj report
      await tx.reservationReport.update({
        where: { sourceReservationId: event.sourceReservationId },
        data: {
          finalPriceRsd:    event.finalPriceRsd,
          finalPriceForeign: event.finalPriceForeign,
          discountType:     event.discountType,
          discountAmountRsd: event.discountAmountRsd,
          updatedAt:        new Date(event.updatedAt),
          syncedAt:         new Date(),
        },
      });

      // Koriguj daily_stats prihod (ako se cijena promijenila)
      if (priceDiff !== 0) {
        const statDate = new Date(existing.createdAt);
        statDate.setHours(0, 0, 0, 0);

        await tx.dailyStats.updateMany({
          where: { statDate },
          data: {
            totalRevenueRsd: { increment: priceDiff },
          },
        });
      }
    });
  }

  // ════════════════════════════════════════════════════
  //  RESERVATION CANCELLED — označi kao otkazano
  //  i povuci prihod iz statistike
  // ════════════════════════════════════════════════════
  async handleCancelled(
    sourceReservationId: number,
    cancelledAt:         string,
  ): Promise<void> {
    const existing = await prisma.reservationReport.findUnique({
      where: { sourceReservationId },
      include: { services: true },
    });

    if (!existing) {
      console.warn(
        `⚠  [A.2] ReservationReport not found for source ID: ${sourceReservationId}`,
      );
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Ažuriraj status na CANCELLED
      await tx.reservationReport.update({
        where: { sourceReservationId },
        data: {
          status:    'CANCELLED',
          updatedAt: new Date(cancelledAt),
          syncedAt:  new Date(),
        },
      });

      // Oduzmi prihod iz daily_stats (rezervacija otkazana)
      const statDate = new Date(existing.createdAt);
      statDate.setHours(0, 0, 0, 0);

      await tx.dailyStats.updateMany({
        where: { statDate },
        data: {
          totalReservations: { decrement: 1 },
          totalRevenueRsd:   { decrement: existing.finalPriceRsd },
        },
      });

      // Oduzmi termine iz category_stats
      const categoryGroups = existing.services.reduce(
        (acc, s) => {
          const key = s.categoryId;
          if (!acc[key]) acc[key] = { slots: 0, revenue: 0 };
          acc[key].slots  += 1;
          acc[key].revenue += Number(s.priceSnapshotRsd);
          return acc;
        },
        {} as Record<number, { slots: number; revenue: number }>,
      );

      for (const [catId, values] of Object.entries(categoryGroups)) {
        await tx.categoryStats.updateMany({
          where: { categoryId: parseInt(catId, 10) },
          data: {
            totalBookedSlots: { decrement: values.slots },
            totalRevenueRsd:  { decrement: values.revenue },
          },
        });
      }
    });
  }

  // ════════════════════════════════════════════════════
  //  REPORTING QUERY METODE
  // ════════════════════════════════════════════════════

  // UC21: Termini po kategoriji
  async getCategoryStats(): Promise<CategoryStatRow[]> {
    const stats = await prisma.categoryStats.findMany({
      orderBy: { totalBookedSlots: 'desc' },
    });

    return stats.map((s) => ({
      categoryId:       s.categoryId,
      categoryNaziv:    s.categoryNaziv,
      totalBookedSlots: s.totalBookedSlots,
      totalRevenueRsd:  Number(s.totalRevenueRsd),
    }));
  }

  // UC21: Real-time — direktan COUNT iz services_report tabele
  async getCategoryStatsRealtime(): Promise<CategoryStatRow[]> {
    const results = await prisma.reservationServiceReport.groupBy({
      by:    ['categoryId', 'categoryNaziv'],
      where: {
        reservation: { status: 'CONFIRMED' },
      },
      _count:    { id: true },
      _sum:      { priceSnapshotRsd: true },
      orderBy:   { _count: { id: 'desc' } },
    });

    return results.map((r) => ({
      categoryId:       r.categoryId,
      categoryNaziv:    r.categoryNaziv,
      totalBookedSlots: r._count.id,
      totalRevenueRsd:  Number(r._sum.priceSnapshotRsd ?? 0),
    }));
  }

  // UC23: Rezervacije po danima
  async getDailyStats(
    fromDate?: string,
    toDate?:   string,
  ): Promise<DailyStatRow[]> {
    const where: any = {};

    if (fromDate || toDate) {
      where.statDate = {};
      if (fromDate) where.statDate.gte = new Date(fromDate);
      if (toDate)   where.statDate.lte = new Date(toDate);
    }

    const stats = await prisma.dailyStats.findMany({
      where,
      orderBy: { statDate: 'asc' },
    });

    return stats.map((s) => ({
      date:              s.statDate.toISOString().split('T')[0],
      totalReservations: s.totalReservations,
      totalRevenueRsd:   Number(s.totalRevenueRsd),
    }));
  }

  // UC23: Real-time — direktan COUNT iz reservations_report tabele
  async getDailyStatsRealtime(
    fromDate?: string,
    toDate?:   string,
  ): Promise<DailyStatRow[]> {
    const where: any = { status: 'CONFIRMED' };

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const reservations = await prisma.reservationReport.findMany({
      where,
      select: { createdAt: true, finalPriceRsd: true },
      orderBy: { createdAt: 'asc' },
    });

    // Grupiši po datumu u memoriji
    const grouped = reservations.reduce(
      (acc, r) => {
        const day = r.createdAt.toISOString().split('T')[0];
        if (!acc[day]) acc[day] = { count: 0, revenue: 0 };
        acc[day].count   += 1;
        acc[day].revenue += Number(r.finalPriceRsd);
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    return Object.entries(grouped).map(([date, values]) => ({
      date,
      totalReservations: values.count,
      totalRevenueRsd:   Math.round(values.revenue * 100) / 100,
    }));
  }

  // Summary statistika za dashboard header
  async getSummary(): Promise<ReportingSummary> {
    const [total, confirmed, cancelled, topCat, lastSync] = await Promise.all([
      prisma.reservationReport.count(),
      prisma.reservationReport.count({ where: { status: 'CONFIRMED' } }),
      prisma.reservationReport.count({ where: { status: 'CANCELLED' } }),
      prisma.categoryStats.findFirst({ orderBy: { totalBookedSlots: 'desc' } }),
      prisma.syncEvent.findFirst({ orderBy: { processedAt: 'desc' } }),
    ]);

    const totalRevenue = await prisma.reservationReport.aggregate({
      where:  { status: 'CONFIRMED' },
      _sum:   { finalPriceRsd: true },
    });

    return {
      totalReservations: total,
      totalRevenueRsd:   Number(totalRevenue._sum.finalPriceRsd ?? 0),
      confirmedCount:    confirmed,
      cancelledCount:    cancelled,
      topCategory:       topCat?.categoryNaziv ?? null,
      lastSyncedAt:      lastSync?.processedAt.toISOString() ?? null,
    };
  }

  // Paginirani listing rezervacija
  async getReservations(page: number, limit: number, status?: string) {
    const where = status ? { status } : {};
    const [items, total] = await Promise.all([
      prisma.reservationReport.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { services: true },
      }),
      prisma.reservationReport.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const reportingRepository = new ReportingRepository();
