import { Router }                from 'express';
import { reservationController } from '../controllers/ReservationController';

export const reservationsRouter = Router();

// POST /api/reservations
// Inicira novu rezervaciju → publish na RabbitMQ
reservationsRouter.post(
  '/',
  (req, res) => reservationController.initiate(req, res),
);

// GET /api/reservations/status/:correlationId
// Polling — provjeri status asinhrone rezervacije
reservationsRouter.get(
  '/status/:correlationId',
  (req, res) => reservationController.getStatus(req, res),
);

// POST /api/reservations/calculate-price
// Preview cijene bez kreiranja rezervacije
reservationsRouter.post(
  '/calculate-price',
  (req, res) => reservationController.calculatePrice(req, res),
);

// GET /api/reservations/my?sifra=XXX&email=yyy@example.com
// Dohvata detalje rezervacije po šifri + email
reservationsRouter.get(
  '/my',
  (req, res) => reservationController.getByCredentials(req, res),
);

// POST /api/reservations/add-service
// Dodaje novu uslugu u postojeću rezervaciju
reservationsRouter.post(
  '/add-service',
  (req, res) => reservationController.addService(req, res),
);

// POST /api/reservations/remove-service
// Uklanja uslugu iz postojeće rezervacije
reservationsRouter.post(
  '/remove-service',
  (req, res) => reservationController.removeService(req, res),
);

// POST /api/reservations/cancel
// Otkazuje rezervaciju (ostaje u istoriji)
reservationsRouter.post(
  '/cancel',
  (req, res) => reservationController.cancel(req, res),
);
