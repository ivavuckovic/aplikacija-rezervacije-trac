import { Request, Response } from 'express';
import { z }                 from 'zod';
import { salonInfoRepository }        from '../../infrastructure/repositories';
import { allowedCurrencyRepository }  from '../../infrastructure/repositories';
import { discountConfigRepository }   from '../../infrastructure/repositories';
import { redisClient }                from '../../infrastructure/cache/redisClient';
import { ApiResponse }                from '../../domain/types';

const SALON_INFO_CACHE_KEY = 'salon:info';
const SALON_INFO_TTL       = parseInt(process.env.SALON_INFO_CACHE_TTL ?? '3600', 10);

const UpdateSalonInfoSchema = z.object({
  naziv:        z.string().min(2).max(100).optional(),
  lokacija:     z.string().min(3).max(255).optional(),
  opis:         z.string().min(10).optional(),
  radnoVremeOd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Format mora biti HH:MM')
    .optional(),
  radnoVremeDo: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Format mora biti HH:MM')
    .optional(),
});

export class SalonInfoController {

  // GET /api/salon-info
  async get(req: Request, res: Response): Promise<void> {
    try {
      // 1. Pokušaj iz Redis keša
      const cached = await redisClient.get<object>(SALON_INFO_CACHE_KEY);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.json({ success: true, data: cached });
        return;
      }

      // 2. Dohvati iz baze
      const salonInfo = await salonInfoRepository.get();
      if (!salonInfo) {
        res.status(404).json({
          success: false,
          message: 'Informacije o salonu nisu pronađene',
        } satisfies ApiResponse);
        return;
      }

      // 3. Keširaj i vrati
      await redisClient.set(SALON_INFO_CACHE_KEY, salonInfo, SALON_INFO_TTL);

      res.setHeader('X-Cache', 'MISS');
      res.json({ success: true, data: salonInfo } satisfies ApiResponse<typeof salonInfo>);
    } catch (error) {
      console.error('❌ SalonInfoController.get:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri dohvatanju informacija o salonu',
      } satisfies ApiResponse);
    }
  }

  // PUT /api/admin/salon-info
  async update(req: Request, res: Response): Promise<void> {
    try {
      const parsed = UpdateSalonInfoSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        } satisfies ApiResponse);
        return;
      }

      const updated = await salonInfoRepository.update(parsed.data);

      // Invalidacija keša — sledeći GET dohvata sveže podatke
      await redisClient.del(SALON_INFO_CACHE_KEY);

      res.json({
        success: true,
        data:    updated,
        message: 'Informacije o salonu su ažurirane',
      } satisfies ApiResponse<typeof updated>);
    } catch (error) {
      console.error('❌ SalonInfoController.update:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri ažuriranju informacija o salonu',
      } satisfies ApiResponse);
    }
  }
}

export const salonInfoController = new SalonInfoController();
