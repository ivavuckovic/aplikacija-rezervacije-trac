# Backend A.2 — Reporting Portal Architecture

## Pregled

Backend A.2 je odvojen sistem posvećen **čitanju i izveštavanju** (OLAP). Sve izmene potiču iz A.1 preko RabbitMQ događaja.

```
A.1 Worker (Publisher)         RabbitMQ              A.2 (Subscriber)
        │                       (Topic)                     │
        ├─ reservation.created──┐                          │
        ├─ reservation.updated──┼─► salon.events ───────┐  │
        └─ reservation.cancelled─┘    exchange          │  │
                                                        ▼  ▼
                                           ┌──────────────────────────┐
                                           │  A2RabbitMQConsumer      │
                                           │  (prefetch=5)            │
                                           │  (3 separate queues)     │
                                           └──────────────────────────┘
                                                     │
                                              SyncService
                                                (orchestrator)
                                                     │
                                        ReportingRepository
                                        (data transformation)
                                                     │
                                          PostgreSQL A.2 (OLAP)
                                          ┌──────────────────────┐
                                          │ reservations_report  │
                                          │ res_services_report  │
                                          │ categories_snapshot  │
                                          │ daily_stats          │
                                          │ category_stats       │
                                          │ sync_events (audit)  │
                                          └──────────────────────┘
                                                     │
                                           HTTP API (reporting)
                                                     │
                                           Frontend A.2
                                           (Charts & Graphs)
```

## Tok Podataka

### 1. **Reservation Created Event**

**Input:**
```
reservation.created event (13 polja + services array)
```

**Obrada (atomična transakcija):**
```
1. Upsert categories_snapshot
   └─ Skupa sve jedinstvene kategorije iz servisa

2. INSERT reservations_report
   └─ Kreiraj glavnu rezervaciju

3. INSERT reservation_services_report
   └─ Ubaci svaki servis posebno

4. UPSERT daily_stats
   └─ Uvećaj dan za +1 rezervaciju i +cijena

5. UPSERT category_stats
   └─ Za svaku kategoriju: +slotsCount, +revenue
```

**Rezultat:**
- Sve tabele su atomički ažurirane
- Ako bilo šta padne → rollback svega
- Konačna konzistentnost između tabela garantovana

### 2. **Reservation Updated Event**

**Input:**
```
sourceReservationId, finalPriceRsd, discountType, itd...
```

**Obrada:**
```
1. Pronađi postojeću rezervaciju

2. Izračunaj razliku u cijeni
   priceDiff = newPrice - oldPrice

3. UPDATE reservations_report
   └─ Postavi nove cijene i discountType

4. Koriguj daily_stats
   └─ Ako je cijena različita: daily.totalRevenueRsd += priceDiff
```

**Rezultat:**
- Cijena je ažurirana bez duplog brojanja
- Svakodnevni prihodi su tonski tačni

### 3. **Reservation Cancelled Event**

**Input:**
```
sourceReservationId, cancelledAt
```

**Obrada:**
```
1. UPDATE reservations_report
   └─ status: CONFIRMED → CANCELLED

2. Pronađi sve servise za ovu rezervaciju

3. Oduzmi iz daily_stats
   └─ totalReservations: -1
   └─ totalRevenueRsd: -existingPrice

4. Oduzmi iz category_stats (po kategoriji)
   └─ totalBookedSlots: -slotCount
   └─ totalRevenueRsd: -categoryRevenue
```

**Rezultat:**
- Otkazane rezervacije se ne računaju u statistici
- Prihod se povlači iz svih relevantnih tabela

## Idempotentnost

Svaki događaj se prati u `sync_events` tabeli:

```
sync_events {
  eventId: UUID              (PRIMARY)
  eventType: string
  sourceReservationId: int
  payload: JSON
  status: 'SUCCESS' | 'ERROR'
  errorMessage?: string
  processedAt: DateTime
}
```

**Logika:**
1. Primljen event → provjeri `isEventProcessed(eventId)`
2. Ako već postoji → preskoči (idempotent)
3. Ako ne postoji → obradi
4. Nakon obrade → insertuj u sync_events sa statusom

**Rezultat:**
- Dupli događaji se ne obrađuju
- Mogu se ponoviti bez štete
- Audit trail za sve obrade

## Tabele A.2

### `reservations_report`
```sql
id (PRIMARY)
sourceReservationId (unique)
correlationId
status ('CONFIRMED' | 'CANCELLED')
email, currency
finalPriceRsd, finalPriceForeign
discountType, discountAmountRsd
promoCodeApplied
createdAt, updatedAt, syncedAt
```

### `reservation_services_report`
```sql
id (PRIMARY)
reservationReportId (FK)
sourceServiceId
serviceNaziv, categoryId, categoryNaziv
slotDatetime
priceSnapshotRsd
```

### `daily_stats`
```sql
statDate (PRIMARY)
totalReservations (count)
totalRevenueRsd (sum)
```

**Korištenje:** Brzo grafikovanje dnevnih trendova

### `category_stats`
```sql
categoryId (PRIMARY)
categoryNaziv
totalBookedSlots (count)
totalRevenueRsd (sum)
```

**Korištenje:** Brzo grafikovanje po kategoriji

### `categories_snapshot`
```sql
sourceCategoryId (PRIMARY)
naziv
lastSyncedAt
```

**Korištenje:** Track koje su kategorije aktivne/izmijenjene

### `sync_events` (Audit)
```sql
id (PRIMARY)
eventId (UNIQUE)
eventType
sourceReservationId
payload (JSON)
status
errorMessage
processedAt
```

## API Endpointi

### Pre-agregirana (brzo)
```
GET /api/reports/by-category
GET /api/reports/by-date
```
→ Čita iz `category_stats` / `daily_stats`
→ O(1) ili O(n) gde je n mali
→ Ponekad 5-10 minuta zastarelo (async update)

### Real-time (tačno)
```
GET /api/reports/by-category?realtime=true
GET /api/reports/by-date?realtime=true
```
→ GROUP BY query direktno iz transakcijskih tabela
→ O(n) - puno sporije
→ Uvek 100% tačno

### Rešenje za vlasnika
- **Primarni prikaz:** pre-agregirana verzija (brza, zadovoljava)
- **Ako nađe grešku:** prebaci na real-time za tačnu provjeru
- **Nema čekanja:** UI nije blokiran

## Consumer Karakteristike

```javascript
prefetch: 5           // 5 poruka paralelno (reporti su nezavisni)
maxRetries: ∞         // Nema retrya — greške se logiraju
NACK behavior: false  // Ne vraćaj u red
TTL per message: 24h  // Ako pade nakon 24h, brisanje
```

**Zbog čega drugačije od Worker-a (prefetch=1, max_retries=3)?**
- Worker A.1: **Kritičan** — svaka greška može блокира rezervaciju
- Backend A.2: **Reporting** — greška znači samo zastarele grafikone
- Vlasnik može čekati ili ručno re-syncu

## Error Handling

| Scenario | Action |
|----------|--------|
| Event već obrađen | Skip (idempotent) |
| ReservationReport ne postoji | Log warning, continue |
| DB transakcija pada | NACK bez retry, log u sync_events |
| RabbitMQ padne | Auto-reconnect svakih 5s |
| Sync event sačuvan | Uvek — čak i greške |

## Performance Consideration

### Daily Stats
- **Pre-agg:** 1 red po danu = 365 redaka/god
- **Real-time:** GROUP BY na 40k+ redaka
- Trade-off: Brzina vs tačnost

### Category Stats
- **Pre-agg:** ~20 kategorija = 20 redaka
- **Real-time:** GROUP BY na res_services_report
- Obično brz, ali zavisi od indexa

### Preporuke za produkciju
1. **Indexiraj:**
   - `reservations_report(createdAt, status)`
   - `reservation_services_report(categoryId, price)`

2. **Archival:**
   - Premjesti stare podatke nakon 1 godine u archive tabele
   - Čuva daily_stats i category_stats (mali volumen)

3. **Monitoring:**
   - Provjeri `sync_events` za greške
   - Postavi alert ako `lastSuccessAt` je > 1h
