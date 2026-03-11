import { Router }             from 'express';
import { salonInfoController } from '../controllers/SalonInfoController';

export const salonInfoRouter = Router();

// GET /api/salon-info
// Vraća osnovne informacije o salonu (sa Redis kešom)
salonInfoRouter.get('/', (req, res) => salonInfoController.get(req, res));
