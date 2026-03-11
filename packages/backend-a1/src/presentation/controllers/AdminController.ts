import { Request, Response } from 'express';
import { z }                 from 'zod';
import { prisma }                     from '../../infrastructure/database/prismaClient';
import { salonInfoController }        from './SalonInfoController';
import { allowedCurrencyRepository }  from '../../infrastructure/repositories';
import { discountConfigRepository }   from '../../infrastructure/repositories';
import { redisClient }                from '../../infrastructure/cache/redisClient';

// ── Validacione sheme ────────────────────────────────

const CategorySchema = z.object({
  naziv:    z.string().min(2, 'Naziv mora imati bar 2 karaktera').max(100),
  opis:     z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

const ServiceSchema = z.object({
  categoryId:                   z.number().int().positive(),
  naziv:                        z.string().min(2).max(150),
  opis:                         z.string().max(1000).optional(),
  trajanjeMin:                  z.number().int().min(15, 'Minimalno trajanje je 15 minuta'),
  maxKlijenataPoTerminu:        z.number().int().min(1).max(20),
  vremePocetkaPrvogTermina:     z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  vremeZavrsetkaPoslednjeg:     z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  cenaRsd:                      z.number().positive('Cena mora biti pozitivan broj'),
  isActive:                     z.boolean().optional().default(true),
});

const CurrencySchema = z.object({
  code:     z.string().length(3).toUpperCase(),
  naziv:    z.string().min(2).max(50),
  isActive: z.boolean().optional().default(true),
});

const DiscountConfigSchema = z.object({
  discountPercentage: z
    .number()
    .min(0)
    .max(100)
    .default(10),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format datuma: YYYY-MM-DD')
    .refine(
      (d) => new Date(d) > new Date(),
      'Datum mora biti u budućnosti',
    ),
});

// ── Kontroler ─────────────────────────────────────────

export class AdminController {

  // ─── SALON INFO ───────────────────────────────────

  // PUT /api/admin/salon-info
  updateSalonInfo = salonInfoController.update.bind(salonInfoController);

  // ─── KATEGORIJE ───────────────────────────────────

  // GET /api/admin/categories
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await prisma.serviceCategory.findMany({
        include: { _count: { select: { services: true } } },
        orderBy: { naziv: 'asc' },
      });

      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Greška pri dohvatanju kategorija' });
    }
  }

  // POST /api/admin/categories
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CategorySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        return;
      }

      const existing = await prisma.serviceCategory.findUnique({
        where: { naziv: parsed.data.naziv },
      });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Kategorija "${parsed.data.naziv}" već postoji`,
        });
        return;
      }

      const category = await prisma.serviceCategory.create({
        data: parsed.data,
      });

      // Invalidacija keša usluga
      await redisClient.del('salon:services:by-category');

      res.status(201).json({
        success: true,
        data:    category,
        message: 'Kategorija kreirana',
      });
    } catch (error) {
      console.error('❌ AdminController.createCategory:', error);
      res.status(500).json({ success: false, message: 'Greška pri kreiranju kategorije' });
    }
  }

  // PUT /api/admin/categories/:id
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const id     = parseInt(req.params.id, 10);
      const parsed = CategorySchema.partial().safeParse(req.body);

      if (isNaN(id) || !parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Neispravan zahtev',
          errors:  parsed.success ? [] : parsed.error.errors.map((e) => e.message),
        });
        return;
      }

      const existing = await prisma.serviceCategory.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Kategorija nije pronađena' });
        return;
      }

      const updated = await prisma.serviceCategory.update({
        where: { id },
        data:  parsed.data,
      });

      await redisClient.del('salon:services:by-category');

      res.json({ success: true, data: updated, message: 'Kategorija ažurirana' });
    } catch (error) {
      console.error('❌ AdminController.updateCategory:', error);
      res.status(500).json({ success: false, message: 'Greška pri ažuriranju kategorije' });
    }
  }

  // DELETE /api/admin/categories/:id
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Neispravan ID' });
        return;
      }

      // Provjeri da kategorija nema aktivne usluge
      const serviceCount = await prisma.service.count({
        where: { categoryId: id, isActive: true },
      });

      if (serviceCount > 0) {
        res.status(409).json({
          success: false,
          message: `Kategorija ima ${serviceCount} aktivnih usluga. Deaktivirajte ih prvo.`,
        });
        return;
      }

      // Soft-delete — postavi isActive = false
      await prisma.serviceCategory.update({
        where: { id },
        data:  { isActive: false },
      });

      await redisClient.del('salon:services:by-category');

      res.json({ success: true, message: 'Kategorija deaktivirana' });
    } catch (error) {
      console.error('❌ AdminController.deleteCategory:', error);
      res.status(500).json({ success: false, message: 'Greška pri brisanju kategorije' });
    }
  }

  // ─── USLUGE ───────────────────────────────────────

  // GET /api/admin/services
  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const services = await prisma.service.findMany({
        include: { category: true },
        orderBy: [{ category: { naziv: 'asc' } }, { naziv: 'asc' }],
      });

      res.json({
        success: true,
        data:    services.map((s) => ({
          ...s,
          cenaRsd: Number(s.cenaRsd),
        })),
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Greška pri dohvatanju usluga' });
    }
  }

  // POST /api/admin/services
  async createService(req: Request, res: Response): Promise<void> {
    try {
      const parsed = ServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        return;
      }

      // Provjeri da kategorija postoji
      const category = await prisma.serviceCategory.findFirst({
        where: { id: parsed.data.categoryId, isActive: true },
      });
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Kategorija nije pronađena ili nije aktivna',
        });
        return;
      }

      // Provjeri logiku vremena (početak < kraj)
      const [sh, sm] = parsed.data.vremePocetkaPrvogTermina.split(':').map(Number);
      const [eh, em] = parsed.data.vremeZavrsetkaPoslednjeg.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        res.status(400).json({
          success: false,
          message: 'Vreme početka mora biti pre vremena završetka',
        });
        return;
      }

      const service = await prisma.service.create({
        data: {
          ...parsed.data,
          cenaRsd: parsed.data.cenaRsd,
        },
        include: { category: true },
      });

      await redisClient.del('salon:services:by-category');

      res.status(201).json({
        success: true,
        data:    { ...service, cenaRsd: Number(service.cenaRsd) },
        message: 'Usluga kreirana',
      });
    } catch (error) {
      console.error('❌ AdminController.createService:', error);
      res.status(500).json({ success: false, message: 'Greška pri kreiranju usluge' });
    }
  }

  // PUT /api/admin/services/:id
  async updateService(req: Request, res: Response): Promise<void> {
    try {
      const id     = parseInt(req.params.id, 10);
      const parsed = ServiceSchema.partial().safeParse(req.body);

      if (isNaN(id) || !parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Neispravan zahtev',
          errors:  parsed.success ? [] : parsed.error.errors.map((e) => e.message),
        });
        return;
      }

      const existing = await prisma.service.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Usluga nije pronađena' });
        return;
      }

      const updated = await prisma.service.update({
        where:   { id },
        data:    parsed.data,
        include: { category: true },
      });

      await redisClient.del('salon:services:by-category');

      res.json({
        success: true,
        data:    { ...updated, cenaRsd: Number(updated.cenaRsd) },
        message: 'Usluga ažurirana',
      });
    } catch (error) {
      console.error('❌ AdminController.updateService:', error);
      res.status(500).json({ success: false, message: 'Greška pri ažuriranju usluge' });
    }
  }

  // DELETE /api/admin/services/:id  (soft-delete)
  async deleteService(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Neispravan ID' });
        return;
      }

      const existing = await prisma.service.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ success: false, message: 'Usluga nije pronađena' });
        return;
      }

      await prisma.service.update({
        where: { id },
        data:  { isActive: false },
      });

      await redisClient.del('salon:services:by-category');

      res.json({ success: true, message: 'Usluga deaktivirana' });
    } catch (error) {
      console.error('❌ AdminController.deleteService:', error);
      res.status(500).json({ success: false, message: 'Greška pri brisanju usluge' });
    }
  }

  // ─── VALUTE ────────────────────────────────────────

  // GET /api/admin/currencies
  async getCurrencies(req: Request, res: Response): Promise<void> {
    try {
      const currencies = await allowedCurrencyRepository.findAll();
      res.json({ success: true, data: currencies });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Greška pri dohvatanju valuta' });
    }
  }

  // POST /api/admin/currencies
  async upsertCurrency(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CurrencySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        return;
      }

      const currency = await allowedCurrencyRepository.upsert(
        parsed.data.code,
        parsed.data.naziv,
      );

      res.json({ success: true, data: currency, message: 'Valuta sačuvana' });
    } catch (error) {
      console.error('❌ AdminController.upsertCurrency:', error);
      res.status(500).json({ success: false, message: 'Greška pri čuvanju valute' });
    }
  }

  // PATCH /api/admin/currencies/:code/toggle
  async toggleCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { code }    = req.params;
      const { isActive } = req.body as { isActive?: boolean };

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ success: false, message: 'isActive mora biti boolean' });
        return;
      }

      // RSD se ne može deaktivirati (bazna valuta)
      if (code.toUpperCase() === 'RSD' && !isActive) {
        res.status(400).json({
          success: false,
          message: 'RSD je bazna valuta i ne može biti deaktivirana',
        });
        return;
      }

      const currency = await allowedCurrencyRepository.setActive(code, isActive);
      res.json({
        success: true,
        data:    currency,
        message: `Valuta ${code} ${isActive ? 'aktivirana' : 'deaktivirana'}`,
      });
    } catch (error) {
      console.error('❌ AdminController.toggleCurrency:', error);
      res.status(500).json({ success: false, message: 'Greška pri ažuriranju valute' });
    }
  }

  // ─── POPUST ───────────────────────────────────────

  // GET /api/admin/discount-config
  async getDiscountConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await discountConfigRepository.getActive();
      res.json({ success: true, data: config });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Greška pri dohvatanju konfiguracije popusta' });
    }
  }

  // PUT /api/admin/discount-config
  async updateDiscountConfig(req: Request, res: Response): Promise<void> {
    try {
      const parsed = DiscountConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        return;
      }

      const config = await discountConfigRepository.upsert(
        parsed.data.discountPercentage,
        new Date(parsed.data.validUntil),
      );

      res.json({
        success: true,
        data:    config,
        message: 'Konfiguracija popusta ažurirana',
      });
    } catch (error) {
      console.error('❌ AdminController.updateDiscountConfig:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri ažuriranju konfiguracije popusta',
      });
    }
  }
}

export const adminController = new AdminController();
