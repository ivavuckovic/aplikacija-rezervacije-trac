import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

export const app = express();

// ── Middleware ──────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ── Health check ────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-a2' });
});

// TODO: reporting routes will be added in Step 16
