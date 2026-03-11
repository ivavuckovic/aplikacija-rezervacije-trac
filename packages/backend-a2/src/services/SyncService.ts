import { reportingRepository } from '../infrastructure/repositories/ReportingRepository';
import type {
  SalonEvent,
  ReservationCreatedEvent,
  ReservationUpdatedEvent,
  ReservationCancelledEvent,
} from '../types';

export class SyncService {

  async processEvent(event: SalonEvent): Promise<void> {
    const { eventId, eventType } = event;

    // 1. Idempotentnost — preskoči ako je već obrađeno
    const alreadyProcessed = await reportingRepository.isEventProcessed(eventId);
    if (alreadyProcessed) {
      console.log(`⏭  [A.2] Event already processed: ${eventId}`);
      return;
    }

    console.log(`🔄 [A.2] Processing event: ${eventType} | ${eventId}`);

    try {
      switch (eventType) {
        case 'reservation.created':
          await reportingRepository.handleCreated(event as ReservationCreatedEvent);
          break;

        case 'reservation.updated':
          await reportingRepository.handleUpdated(event as ReservationUpdatedEvent);
          break;

        case 'reservation.cancelled':
          const cancelled = event as ReservationCancelledEvent;
          await reportingRepository.handleCancelled(
            cancelled.sourceReservationId,
            cancelled.cancelledAt,
          );
          break;

        default:
          console.warn(`⚠  [A.2] Unknown event type: ${eventType}`);
          return;
      }

      // 2. Označi kao obrađeno (idempotency log)
      await reportingRepository.markEventProcessed(
        eventId,
        eventType,
        (event as any).sourceReservationId,
        event,
        'SUCCESS',
      );

      console.log(`✅ [A.2] Event processed: ${eventType} | ${eventId}`);

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [A.2] Event processing failed: ${eventId} — ${errMsg}`);

      // Logiraj grešku u sync_events
      await reportingRepository.markEventProcessed(
        eventId,
        eventType,
        (event as any).sourceReservationId ?? 0,
        event,
        'ERROR',
        errMsg,
      ).catch(console.error);

      throw error; // Propagiraj za NACK
    }
  }
}

export const syncService = new SyncService();
