import { Request, Response } from 'express';
import { z }                 from 'zod';
import { serviceRepository }       from '../../infrastructure/repositories';
import { slotAvailabilityService } from '../../application/services';
import { redisClient }             from '../../infrastructure/cache/redisClient';
import { ApiResponse }             from '../../domain/types';

const SERVICES_CACHE_KEY = 'salon:services:by-category';
const SERVICES_TTL       = parseInt(process.env.SERVICES_CACHE_TTL ?? '600', 10);

export class ServicesController {

  // GET /api/services
  // Vraća sve aktivne usluge grupisane po kategorijama
  async getAllByCategory(req: Request, res: Response): Promise<void> {
    try {
      // 1. Pokušaj keš
      const cached = await redisClient.get<object>(SERVICES_CACHE_KEY);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.json({ success: true, data: cached });
        return;
      }

      // 2. Dohvati iz baze
      const categories = await serviceRepository.findAllByCategory();

      // 3. Formatiraj response
      const formatted = categories.map((cat) => ({
        id:       cat.id,
        naziv:    cat.naziv,
        opis:     cat.opis,
        services: cat.services.map((svc) => ({
          id:                        svc.id,
          naziv:                     svc.naziv,
          opis:                      svc.opis,
          trajanjeMin:               svc.trajanjeMin,
          maxKlijenataPoTerminu:     svc.maxKlijenataPoTerminu,
          vremePocetkaPrvogTermina:  svc.vremePocetkaPrvogTermina,
          vremeZavrsetkaPoslednjeg:  svc.vremeZavrsetkaPoslednjeg,
          cenaRsd:                   Number(svc.cenaRsd),
        })),
      }));

      // 4. Keširaj
      await redisClient.set(SERVICES_CACHE_KEY, formatted, SERVICES_TTL);

      res.setHeader('X-Cache', 'MISS');
      res.json({ success: true, data: formatted });
    } catch (error) {
      console.error('❌ ServicesController.getAllByCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri dohvatanju usluga',
      } satisfies ApiResponse);
    }
  }

  // GET /api/services/:id
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Neispravan ID usluge' });
        return;
      }

      const service = await serviceRepository.findById(id);
      if (!service) {
        res.status(404).json({ success: false, message: 'Usluga nije pronađena' });
        return;
      }

      res.json({
        success: true,
        data: {
          id:                       service.id,
          categoryId:               service.categoryId,
          categoryNaziv:            service.category.naziv,
          naziv:                    service.naziv,
          opis:                     service.opis,
          trajanjeMin:              service.trajanjeMin,
          maxKlijenataPoTerminu:    service.maxKlijenataPoTerminu,
          vremePocetkaPrvogTermina: service.vremePocetkaPrvogTermina,
          vremeZavrsetkaPoslednjeg: service.vremeZavrsetkaPoslednjeg,
          cenaRsd:                  Number(service.cenaRsd),
        },
      });
    } catch (error) {
      console.error('❌ ServicesController.getById:', error);
      res.status(500).json({ success: false, message: 'Greška pri dohvatanju usluge' });
    }
  }

  // GET /api/services/:id/available-slots?date=YYYY-MM-DD
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Neispravan ID usluge' });
        return;
      }

      // Validacija query parametra
      const querySchema = z.object({
        date: z
          .string({ required_error: 'Parametar date je obavezan' })
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format datuma mora biti YYYY-MM-DD')
          .refine((d) => {
            const parsed = new Date(d);
            return !isNaN(parsed.getTime());
          }, 'Neispravan datum')
          .refine((d) => {
            const date  = new Date(d);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date >= today;
          }, 'Datum ne može biti u prošlosti'),
      });

      const parsed = querySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => e.message),
        });
        return;
      }

      const slots = await slotAvailabilityService.getAvailableSlots(
        id,
        new Date(parsed.data.date),
      );

      res.json({
        success: true,
        data: {
          serviceId: id,
          date:      parsed.data.date,
          slots,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška pri dohvatanju termina';
      console.error('❌ ServicesController.getAvailableSlots:', error);
      res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500)
        .json({ success: false, message });
    }
  }
}

export const servicesController = new ServicesController();
