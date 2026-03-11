import { serviceRepository }    from '../../infrastructure/repositories';
import { reservationRepository } from '../../infrastructure/repositories';
import { TimeSlot }              from '../../domain/types';

export interface SlotCheck {
  serviceId:    number;
  slotDatetime: Date;
}

export class SlotAvailabilityService {

  async getAvailableSlots(
    serviceId: number,
    date:      Date,
  ): Promise<TimeSlot[]> {
    const service = await serviceRepository.findById(serviceId);
    if (!service) throw new Error(`Service ${serviceId} not found`);

    const allSlots = this.generateSlots(
      serviceId,
      date,
      service.vremePocetkaPrvogTermina,
      service.vremeZavrsetkaPoslednjeg,
      service.trajanjeMin,
      service.maxKlijenataPoTerminu,
    );

    if (allSlots.length === 0) return [];

    const slotsWithAvailability = await Promise.all(
      allSlots.map(async (slot) => {
        const bookedCount = await reservationRepository.countConfirmedForSlot(
          serviceId,
          slot.datetime,
        );

        const availableSpots = service.maxKlijenataPoTerminu - bookedCount;

        return {
          ...slot,
          availableSpots: Math.max(0, availableSpots),
          isFull:         availableSpots <= 0,
        };
      }),
    );

    return slotsWithAvailability;
  }

  async checkSlotAvailable(
    serviceId:    number,
    slotDatetime: Date,
  ): Promise<boolean> {
    const service = await serviceRepository.findById(serviceId);
    if (!service) return false;

    const bookedCount = await reservationRepository.countConfirmedForSlot(
      serviceId,
      slotDatetime,
    );

    return bookedCount < service.maxKlijenataPoTerminu;
  }

  async checkAllSlotsAvailable(slots: SlotCheck[]): Promise<{
    allAvailable: boolean;
    unavailable:  SlotCheck[];
  }> {
    const results = await Promise.all(
      slots.map(async (slot) => ({
        slot,
        available: await this.checkSlotAvailable(
          slot.serviceId,
          slot.slotDatetime,
        ),
      })),
    );

    const unavailable = results
      .filter((r) => !r.available)
      .map((r) => r.slot);

    return {
      allAvailable: unavailable.length === 0,
      unavailable,
    };
  }

  private generateSlots(
    serviceId:    number,
    date:         Date,
    startTimeStr: string,
    endTimeStr:   string,
    durationMin:  number,
    maxClients:   number,
  ): Omit<TimeSlot, 'availableSpots' | 'isFull'>[] {
    const slots: Omit<TimeSlot, 'availableSpots' | 'isFull'>[] = [];

    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH,   endM]   = endTimeStr.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes   = endH   * 60 + endM;

    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    let current = startMinutes;

    while (current + durationMin <= endMinutes) {
      const slotDate = new Date(baseDate);
      slotDate.setHours(
        Math.floor(current / 60),
        current % 60,
        0,
        0,
      );

      if (slotDate > new Date()) {
        slots.push({
          serviceId,
          datetime:    slotDate,
          datetimeStr: slotDate.toISOString(),
          maxSpots:    maxClients,
        });
      }

      current += durationMin;
    }

    return slots;
  }
}

export const slotAvailabilityService = new SlotAvailabilityService();
