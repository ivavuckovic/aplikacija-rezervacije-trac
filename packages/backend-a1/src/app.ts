import express, { Application, Request, Response, NextFunction } from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import morgan  from 'morgan';

import {
  salonInfoRouter,
  servicesRouter,
  reservationsRouter,
  exchangeRateRouter,
  adminRouter,
} from './presentation/routes';

export const app: Application = express();

// ── Security middleware ──────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? '*',
  credentials: true,
}));

// ── Request parsing ──────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health check ─────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status:    'ok',
    service:   'backend-a1',
    timestamp: new Date().toISOString(),
  });
});

// ── API rute ─────────────────────────────────────────
app.use('/api/salon-info', salonInfoRouter);
app.use('/api/services', servicesRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/exchange-rate', exchangeRateRouter);
app.use('/api/admin', adminRouter);

// ── 404 handler ───────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ── Global error handler ─────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});
