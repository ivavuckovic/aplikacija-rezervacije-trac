import { Request, Response } from 'express';
import { z }                 from 'zod';
import { exchangeRateService }        from '../../application/services';
import { allowedCurrencyRepository }  from '../../infrastructure/repositories';

const QuerySchema = z.object({
  target: z
    .string({ required_error: 'Parametar target je obavezan' })
    .length(3, 'Valuta mora biti 3-slovni ISO 4217 kod')
    .toUpperCase(),
  base: z.string().length(3).toUpperCase().optional().default('RSD'),
});

export class ExchangeRateController {

  // GET /api/exchange-rate?target=EUR&base=RSD
  async getRate(req: Request, res: Response): Promise<void> {
    try {
      const parsed = QuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => e.message),
        });
        return;
      }

      const { base, target } = parsed.data;

      // Provjeri da li je ciljna valuta dozvoljena
      const allowed = await allowedCurrencyRepository.findByCode(target);
      if (!allowed || !allowed.isActive) {
        res.status(400).json({
          success: false,
          message: `Valuta ${target} nije dozvoljena`,
        });
        return;
      }

      const result = await exchangeRateService.getRate(base, target);

      res.json({
        success: true,
        data:    result,
        ...(result.isStale && {
          warning: 'Kurs može biti neznatno zastario (korišćen cached kurs)',
        }),
      });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Greška pri dohvatanju kursa valute';
      console.error('❌ ExchangeRateController.getRate:', error);
      res.status(503).json({
        success: false,
        message,
      });
    }
  }

  // GET /api/exchange-rate/allowed-currencies
  // Vraća listu dozvoljenih valuta
  async getAllowedCurrencies(req: Request, res: Response): Promise<void> {
    try {
      const currencies = await allowedCurrencyRepository.findActive();
      res.json({ success: true, data: currencies });
    } catch (error) {
      console.error('❌ ExchangeRateController.getAllowedCurrencies:', error);
      res.status(500).json({
        success: false,
        message: 'Greška pri dohvatanju valuta',
      });
    }
  }
}

export const exchangeRateController = new ExchangeRateController();
