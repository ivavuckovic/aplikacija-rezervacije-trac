import { Router }             from 'express';
import { servicesController } from '../controllers/ServicesController';

export const servicesRouter = Router();

// GET /api/services
// Sve aktivne usluge grupisane po kategorijama
servicesRouter.get(
  '/',
  (req, res) => servicesController.getAllByCategory(req, res),
);

// GET /api/services/:id
// Jedna usluga sa detaljima
servicesRouter.get(
  '/:id',
  (req, res) => servicesController.getById(req, res),
);

// GET /api/services/:id/available-slots?date=YYYY-MM-DD
// Slobodni termini za uslugu na dati datum
servicesRouter.get(
  '/:id/available-slots',
  (req, res) => servicesController.getAvailableSlots(req, res),
);
