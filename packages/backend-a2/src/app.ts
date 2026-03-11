import express, { Application, Request, Response, NextFunction } from 'express';
import cors   from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { reportingRouter } from './presentation/routes/reportingRouter';

export const app: Application = express();

// ── Security & Parsing ────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? '*',
  credentials: true,
}));
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health check ──────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status:    'ok',
    service:   'backend-a2-reporting',
    timestamp: new Date().toISOString(),
  });
});

// ── Reporting API ─────────────────────────────────────
app.use('/api/reports', reportingRouter);

// ── 404 ───────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ [A.2] Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});
