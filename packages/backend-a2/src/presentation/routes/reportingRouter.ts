import { Router }              from 'express';
import { reportingController } from '../controllers/ReportingController';

export const reportingRouter = Router();

// GET /api/reports/summary
// Dashboard header — ukupne stats za menadžera
reportingRouter.get(
  '/summary',
  (req, res) => reportingController.getSummary(req, res),
);

// GET /api/reports/by-category
// UC21 — termini grupisani po kategoriji usluge
// Query: ?realtime=true|false
reportingRouter.get(
  '/by-category',
  (req, res) => reportingController.getByCategory(req, res),
);

// GET /api/reports/by-date
// UC23 — rezervacije hronološki po danima
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&realtime=true|false
reportingRouter.get(
  '/by-date',
  (req, res) => reportingController.getByDate(req, res),
);

// GET /api/reports/reservations
// Paginirani listing za menadžerski pregled
// Query: ?page=1&limit=20&status=CONFIRMED|CANCELLED
reportingRouter.get(
  '/reservations',
  (req, res) => reportingController.getReservations(req, res),
);

// GET /api/reports/sync-status
// Monitoring sinhronizacije
reportingRouter.get(
  '/sync-status',
  (req, res) => reportingController.getSyncStatus(req, res),
);
