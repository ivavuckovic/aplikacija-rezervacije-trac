import { Request, Response } from 'express';
import { reservationApplicationService } from '../../application/services';
import {
  CreateReservationSchema,
  CalculatePriceSchema,
  AddServiceSchema,
  RemoveServiceSchema,
  CancelReservationSchema,
} from '../../application/dto/CreateReservationDTO';
import { ApiResponse } from '../../domain/types';

export class ReservationController {

  // POST /api/reservations
  // Inicira rezervaciju — validira i publish-uje na RabbitMQ
  async initiate(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CreateReservationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map(
            (e) => `${e.path.join('.')}: ${e.message}`,
          ),
        } satisfies ApiResponse);
        return;
      }

      const result = await reservationApplicationService.initiateReservation(
        parsed.data,
      );

      // 202 Accepted — rezervacija se obrađuje asinhrono
      res.status(202).json({
        success: true,
        data:    result,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška pri kreiranju rezervacije';
      console.error('❌ ReservationController.initiate:', error);
      res.status(400).json({ success: false, message } satisfies ApiResponse);
    }
  }

  // GET /api/reservations/status/:correlationId
  // Polling endpoint za provjeru statusa rezervacije
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { correlationId } = req.params;

      if (!correlationId || !/^[0-9a-f-]{36}$/.test(correlationId)) {
        res.status(400).json({
          success: false,
          message: 'Neispravan correlationId format',
        });
        return;
      }

      const result = await reservationApplicationService.getReservationStatus(
        correlationId,
      );

      // Ako je PENDING — 202, inače 200
      const statusCode = result.status === 'PENDING' ? 202 : 200;

      res.status(statusCode).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška';
      const isNotFound = message.toLowerCase().includes('nije pronađen');
      res.status(isNotFound ? 404 : 500).json({ success: false, message });
    }
  }

  // POST /api/reservations/calculate-price
  // Preview cijene bez kreiranja rezervacije
  async calculatePrice(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CalculatePriceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        return;
      }

      const breakdown = await reservationApplicationService.calculatePrice(
        parsed.data,
      );

      res.json({ success: true, data: breakdown });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška pri obračunu cijene';
      console.error('❌ ReservationController.calculatePrice:', error);
      res.status(400).json({ success: false, message });
    }
  }

  // GET /api/reservations/my?sifra=XXX&email=yyy
  // Dohvata detalje rezervacije po šifri i emailu
  async getByCredentials(req: Request, res: Response): Promise<void> {
    try {
      const { sifra, email } = req.query as { sifra?: string; email?: string };

      if (!sifra || !email) {
        res.status(400).json({
          success: false,
          message: 'Parametri sifra i email su obavezni',
        });
        return;
      }

      const reservation = await reservationApplicationService
        .getReservationByCredentials(sifra, email);

      res.json({
        success: true,
        data: {
          id:                reservation.id,
          status:            reservation.status,
          sifra:             reservation.sifra,
          ime:               reservation.ime,
          prezime:           reservation.prezime,
          email:             reservation.email,
          adresa:            reservation.adresa,
          postanskiBroj:     reservation.postanskiBroj,
          mesto:             reservation.mesto,
          drzava:            reservation.drzava,
          currency:          reservation.currency,
          basePriceRsd:      Number(reservation.basePriceRsd),
          discountAmountRsd: Number(reservation.discountAmountRsd),
          discountType:      reservation.discountType,
          finalPriceRsd:     Number(reservation.finalPriceRsd),
          finalPriceForeign: Number(reservation.finalPriceForeign),
          promoCodeApplied:  reservation.promoCodeApplied,
          createdAt:         reservation.createdAt,
          promoCode:         reservation.generatedPromoCode?.code,
          services:          reservation.reservationServices.map((rs) => ({
            serviceId:        rs.serviceId,
            serviceNaziv:     rs.service.naziv,
            categoryNaziv:    rs.service.category.naziv,
            slotDatetime:     rs.slotDatetime,
            priceSnapshotRsd: Number(rs.priceSnapshotRsd),
          })),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška';
      const isNotFound = message.toLowerCase().includes('nije pronađen');
      res.status(isNotFound ? 404 : 500).json({ success: false, message });
    }
  }

  // POST /api/reservations/add-service
  // Dodaje uslugu u postojeću rezervaciju
  async addService(req: Request, res: Response): Promise<void> {
    try {
      const parsed = AddServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        return;
      }

      const result = await reservationApplicationService.addService(parsed.data);

      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška pri dodavanju usluge';
      const isNotFound = message.toLowerCase().includes('nije pronađen');
      console.error('❌ ReservationController.addService:', error);
      res.status(isNotFound ? 404 : 400).json({ success: false, message });
    }
  }

  // POST /api/reservations/remove-service
  // Uklanja uslugu iz postojeće rezervacije
  async removeService(req: Request, res: Response): Promise<void> {
    try {
      const parsed = RemoveServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        return;
      }

      const result = await reservationApplicationService.removeService(
        parsed.data,
      );

      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška pri uklanjanju usluge';
      const isNotFound = message.toLowerCase().includes('nije pronađen');
      console.error('❌ ReservationController.removeService:', error);
      res.status(isNotFound ? 404 : 400).json({ success: false, message });
    }
  }

  // POST /api/reservations/cancel
  // Otkazuje rezervaciju po šifri i emailu
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const parsed = CancelReservationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Validacija nije uspela',
          errors:  parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        });
        return;
      }

      const result = await reservationApplicationService.cancelReservation(
        parsed.data,
      );

      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška pri otkazivanju';
      const isNotFound = message.toLowerCase().includes('nije pronađen');
      console.error('❌ ReservationController.cancel:', error);
      res.status(isNotFound ? 404 : 400).json({ success: false, message });
    }
  }
}

export const reservationController = new ReservationController();
