import { Request, Response } from 'express';
import { z }                 from 'zod';
import { reportingRepository } from '../../infrastructure/repositories/ReportingRepository';
import { prisma }             from '../../database/prismaClient';

// ── Query sheme ─────────────────────────────────────
const DateRangeSchema = z.object({
  from:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  realtime: z.enum(['true', 'false']).optional().default('false'),
});

const PaginationSchema = z.object({
  page:   z.string().optional().transform((v) => parseInt(v ?? '1', 10)),
  limit:  z.string().optional().transform((v) => Math.min(parseInt(v ?? '20', 10), 100)),
  status: z.enum(['CONFIRMED', 'CANCELLED']).optional(),
});

export class ReportingController {

  // GET /api/reports/summary
  // Dashboard header — ukupne statistike
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await reportingRepository.getSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('❌ ReportingController.getSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri dohvatanju sumarne statistike',
      });
    }
  }

  // GET /api/reports/by-category?realtime=true
  // UC21 — Termini po kategoriji (tabela/grafikon)
  async getByCategory(req: Request, res: Response): Promise<void> {
    try {
      const parsed = DateRangeSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Neispravan query parametar',
          errors:  parsed.error.errors.map((e) => e.message),
        });
        return;
      }

      const useRealtime = parsed.data.realtime === 'true';

      const data = useRealtime
        ? await reportingRepository.getCategoryStatsRealtime()
        : await reportingRepository.getCategoryStats();

      res.json({
        success:  true,
        data,
        meta: {
          realtime:    useRealtime,
          generatedAt: new Date().toISOString(),
          count:       data.length,
        },
      });
    } catch (error) {
      console.error('❌ ReportingController.getByCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri dohvatanju statistike po kategorijama',
      });
    }
  }

  // GET /api/reports/by-date?from=YYYY-MM-DD&to=YYYY-MM-DD&realtime=true
  // UC23 — Rezervacije po danima (hronološki grafikon)
  async getByDate(req: Request, res: Response): Promise<void> {
    try {
      const parsed = DateRangeSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Neispravan query parametar',
          errors:  parsed.error.errors.map((e) => e.message),
        });
        return;
      }

      const { from, to, realtime } = parsed.data;
      const useRealtime            = realtime === 'true';

      // Validacija datuma ako su oba zadana
      if (from && to && new Date(from) > new Date(to)) {
        res.status(400).json({
          success: false,
          message: 'Datum "from" ne može biti posle datuma "to"',
        });
        return;
      }

      const data = useRealtime
        ? await reportingRepository.getDailyStatsRealtime(from, to)
        : await reportingRepository.getDailyStats(from, to);

      res.json({
        success: true,
        data,
        meta: {
          realtime:    useRealtime,
          from:        from ?? null,
          to:          to   ?? null,
          generatedAt: new Date().toISOString(),
          count:       data.length,
        },
      });
    } catch (error) {
      console.error('❌ ReportingController.getByDate:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri dohvatanju statistike po datumima',
      });
    }
  }

  // GET /api/reports/reservations?page=1&limit=20&status=CONFIRMED
  // Paginirani listing svih rezervacija za menadžerski pregled
  async getReservations(req: Request, res: Response): Promise<void> {
    try {
      const parsed = PaginationSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ success: false, message: 'Neispravan query' });
        return;
      }

      const { page, limit, status } = parsed.data;
      const result = await reportingRepository.getReservations(
        page,
        limit,
        status,
      );

      res.json({
        success: true,
        data: {
          items: result.items,
          total: result.total,
          page:  result.page,
          limit: result.limit,
          pages: result.pages,
        },
      });
    } catch (error) {
      console.error('❌ ReportingController.getReservations:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri dohvatanju rezervacija',
      });
    }
  }

  // GET /api/reports/sync-status
  // Status sinhronizacije — za monitoring
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const [lastSuccess, lastError, totalProcessed] = await Promise.all([
        prisma.syncEvent.findFirst({
          where:   { status: 'SUCCESS' },
          orderBy: { processedAt: 'desc' },
        }),
        prisma.syncEvent.findFirst({
          where:   { status: 'ERROR' },
          orderBy: { processedAt: 'desc' },
        }),
        prisma.syncEvent.count(),
      ]);

      res.json({
        success: true,
        data: {
          totalProcessed,
          lastSuccessAt: lastSuccess?.processedAt ?? null,
          lastErrorAt:   lastError?.processedAt ?? null,
          lastError:     lastError?.errorMessage ?? null,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Greška pri sync statusu' });
    }
  }
}

export const reportingController = new ReportingController();
