# Worker A.1 — Message Processing Flow

## Kompletan tok od rezervacije do potvrdnog eventa

```
BACKEND A.1                    RABBITMQ                    WORKER A.1
──────────────                 ──────────────              ──────────────
POST /reservations
      │
      ├─ Validiraj input
      ├─ Provjeri valutu
      ├─ Provjeri usluge
      ├─ Provjeri termine (preview)
      ├─ Kalkuliši cijenu
      ├─ INSERT reservation
      │   status=PENDING
      │   sifra=''
      │
      └─ PUBLISH ──────────────► [salon.events]
           routing: res.pending      │
           correlationId: uuid       │
                                     │  bind: reservation.pending.queue
                                     │
                                     ▼
                               [reservation.pending.queue]
                                     │
                                     │ DELIVER
                                     ▼
                                              CONSUME msg
                                              prefetch=1
                                                  │
                                          ┌───────▼──────────┐
                                          │checkAlreadyProc? │
                                          └───────┬──────────┘
                                              NO  │
                                          ┌───────▼──────────┐
                                          │  validateSlots()  │
                                          └───────┬──────────┘
                                            VALID │    INVALID
                                                  │       │
                                          ┌───────▼──┐    ▼
                                          │validatePr │ handleFailure()
                                          │omoCode()  │ UPDATE→FAILED
                                          └───────┬──┘ INSERT error
                                                  │    PUBLISH failed
                                                  │    NACK (no requeue)
                                          ┌───────▼──────────────────┐
                                          │   $transaction {          │
                                          │    UPDATE reservation     │
                                          │      status=CONFIRMED     │
                                          │      sifra=crypto(16)     │
                                          │    INSERT promo_code      │
                                          │      TRAC-XXXXXX          │
                                          │    UPDATE old promo→USED  │
                                          │   }                       │
                                          └───────┬──────────────────┘
                                                  │
                                          ┌───────▼──────────────────┐
                                          │  PUBLISH reservation.     │
                                          │  created → salon.events   │
                                          │  (ka A.2 subscriber-u)    │
                                          └───────┬──────────────────┘
                                                  │
                                                ACK ──────────────► MQ
                                                                     │
FRONTEND                                                             │
──────────                                                           │
GET /status/:correlationId ◄─── 200 CONFIRMED ◄── DB query          │
     sifra: "A3F9..."                                                │
     promoCode: "TRAC-XY9..."                               BACKEND A.2
                                                            ──────────
                                                            Subscribe →
                                                            salon.events
                                                            routing: #
                                                                 │
                                                         INSERT reports
                                                         UPSERT stats
                                                         ACK
```

## Ključne operacije

### 1. **checkAlreadyProcessed(correlationId)**
   - Provjeri da li je `status !== PENDING`
   - Ako je već obrađeno: SKIP + ACK

### 2. **validateSlots(services)**
   - Za svaki termin, brojaj `reservationServices` gdje je `status=CONFIRMED`
   - Ako je `bookedCount >= maxKlijenataPoTerminu` → FAIL
   - Ako je usluga neaktivna → FAIL

### 3. **validatePromoCode(code)**
   - Dohvati promo-kod iz DB
   - Ako ne postoji → INVALID
   - Ako je status `USED` ili `INACTIVE` → INVALID
   - Ako je status `ACTIVE` → OK

### 4. **$transaction: Atomičan upis**
   ```
   1. UPDATE reservation:
      - status: PENDING → CONFIRMED
      - sifra: crypto.randomBytes(16).toString('hex').toUpperCase()
      - discountType: message.priceBreakdown.discountType
      - finalPriceRsd, finalPriceForeign: iz message.priceBreakdown
      - promoCodeApplied: ako je korisnik dao promo-kod
      - promoRejectionReason: ako je promo-kod bio nevažeći

   2. INSERT promo_code (nova):
      - code: `TRAC-${6xRandom}`
      - status: ACTIVE
      - discountPercentage: 5.00
      - generatedByReservationId: reservation.id

   3. UPDATE promo_code (korisčena):
      - status: ACTIVE → USED
      - usedByReservationId: reservation.id
      - usedAt: now()
   ```

### 5. **publishCreatedEvent()**
   - Dohvati sve usluge sa kategorijama
   - Kreiraj `ReservationCreatedEvent`
   - Publish na `salon.events` sa routing key `reservation.created`
   - Event ide ka Backend A.2 sistemu

## Error Handling

### Slot kapacitet prekoračen
```
NACK (requeue=true) → après 3 pokušaja → DLQ
```

### Promo-kod nevažeći u vremenu obrade
```
WARNING: Nastavi bez promo-popusta
UPDATE discountType: BOTH → DATE_BASED
Recalculate finalPrice bez 5% promo rabata
```

### Max retries dostignut
```
UPDATE reservation: status → FAILED
INSERT reservation_errors
PUBLISH reservation.failed event
NACK (requeue=false) → sent to DLQ
```

## Idempotency

- Ako `status !== PENDING`, poruka se preskače (već obrađeno)
- Ako je `status = CONFIRMED`, consumer NACKa bez requeue-a
- Garantira se da se svaka rezervacija obradi tačno jednom

## Graceful Shutdown

- Na `SIGTERM` / `SIGINT`:
  1. Set `isShuttingDown = true`
  2. Wait do 10s za završetak tekuće poruke
  3. Close Consumer
  4. Disconnect Prisma
  5. Exit 0

- Ako se 10s timeout dostigne: Force exit 1
