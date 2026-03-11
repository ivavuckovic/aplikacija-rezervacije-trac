import { Reservation, ReservationService, ReservationStatus } from '../../generated/prisma';
import { prisma } from '../database/prismaClient';
import {
  IReservationRepository,
  CreateReservationData,
  UpdateReservationData,
  ReservationWithServices,
} from './interfaces/IReservationRepository';

export class ReservationRepositoryImpl implements IReservationRepository {

  async findById(id: number): Promise<Reservation | null> {
    return prisma.reservation.findUnique({ where: { id } });
  }

  async findByCorrelationId(correlationId: string): Promise<Reservation | null> {
    return prisma.reservation.findUnique({ where: { correlationId } });
  }

  async findBySifraAndEmail(
    sifra: string,
    email: string,
  ): Promise<ReservationWithServices | null> {
    return prisma.reservation.findFirst({
      where: {
        sifra,
        email: { equals: email, mode: 'insensitive' },
      },
      include: {
        reservationServices: {
          include: {
            service: {
              include: { category: true },
            },
          },
          orderBy: { slotDatetime: 'asc' },
        },
      },
    }) as Promise<ReservationWithServices | null>;
  }

  async create(data: CreateReservationData): Promise<Reservation> {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          correlationId:        data.correlationId,
          sifra:                data.sifra,
          status:               data.status,
          ime:                  data.ime,
          prezime:              data.prezime,
          email:                data.email,
          adresa:               data.adresa,
          postanskiBroj:        data.postanskiBroj,
          mesto:                data.mesto,
          drzava:               data.drzava,
          currency:             data.currency,
          exchangeRate:         data.exchangeRate,
          basePriceRsd:         data.basePriceRsd,
          discountAmountRsd:    data.discountAmountRsd,
          discountType:         data.discountType as any,
          finalPriceRsd:        data.finalPriceRsd,
          finalPriceForeign:    data.finalPriceForeign,
          promoCodeApplied:     data.promoCodeApplied,
          promoRejectionReason: data.promoRejectionReason,
        },
      });

      await tx.reservationService.createMany({
        data: data.services.map((s) => ({
          reservationId:    reservation.id,
          serviceId:        s.serviceId,
          slotDatetime:     s.slotDatetime,
          priceSnapshotRsd: s.priceSnapshotRsd,
        })),
      });

      return reservation;
    });
  }

  async update(id: number, data: UpdateReservationData): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data:  {
        ...data,
        discountType: data.discountType as any,
      },
    });
  }

  async addService(
    reservationId:    number,
    serviceId:        number,
    slotDatetime:     Date,
    priceSnapshotRsd: number,
  ): Promise<ReservationService> {
    return prisma.reservationService.create({
      data: {
        reservationId,
        serviceId,
        slotDatetime,
        priceSnapshotRsd,
      },
    });
  }

  async removeService(
    reservationId: number,
    serviceId:     number,
    slotDatetime:  Date,
  ): Promise<void> {
    await prisma.reservationService.deleteMany({
      where: { reservationId, serviceId, slotDatetime },
    });
  }

  async cancel(id: number): Promise<Reservation> {
    return prisma.reservation.update({
      where: { id },
      data:  { status: ReservationStatus.CANCELLED },
    });
  }

  async createError(
    correlationId: string,
    reason:        string,
    payload?:      object,
  ): Promise<void> {
    await prisma.reservationError.create({
      data: {
        correlationId,
        reason,
        payload: payload ?? {},
      },
    });
  }

  async countConfirmedForSlot(
    serviceId:    number,
    slotDatetime: Date,
  ): Promise<number> {
    return prisma.reservationService.count({
      where: {
        serviceId,
        slotDatetime,
        reservation: {
          status: ReservationStatus.CONFIRMED,
        },
      },
    });
  }
}
