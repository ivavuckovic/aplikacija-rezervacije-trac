import { Router }                 from 'express';
import { exchangeRateController } from '../controllers/ExchangeRateController';

export const exchangeRateRouter = Router();

// GET /api/exchange-rate?target=EUR&base=RSD
// Vraća trenutni kurs (keširan, sa stale fallback)
exchangeRateRouter.get(
  '/',
  (req, res) => exchangeRateController.getRate(req, res),
);

// GET /api/exchange-rate/allowed-currencies
// Lista dozvoljenih valuta
exchangeRateRouter.get(
  '/allowed-currencies',
  (req, res) => exchangeRateController.getAllowedCurrencies(req, res),
);
