# Backend A.2 — Reporting API

Base URL: http://localhost:4001/api

## Reporting Endpointi

### GET /reports/summary
Dashboard header statistike.

Response:
```json
{
  "success": true,
  "data": {
    "totalReservations": 42,
    "totalRevenueRsd": 125000,
    "confirmedCount": 40,
    "cancelledCount": 2,
    "topCategory": "Frizure",
    "lastSyncedAt": "2026-03-11T14:30:00Z"
  }
}
```

### GET /reports/by-category
UC21 — Termini grupisani po kategoriji usluge.

Query params:
  - `realtime=true` → direktan COUNT iz baze (sporije, tačnije)
  - `realtime=false` → pre-agregirana tabela (brže) [DEFAULT]

Response:
```json
{
  "success": true,
  "data": [
    {
      "categoryId": 1,
      "categoryNaziv": "Frizure",
      "totalBookedSlots": 15,
      "totalRevenueRsd": 45000
    }
  ],
  "meta": {
    "realtime": false,
    "generatedAt": "2026-03-11T14:30:00Z",
    "count": 5
  }
}
```

### GET /reports/by-date
UC23 — Broj rezervacija po danima (hronološki).

Query params:
  - `from=YYYY-MM-DD` → od datuma (optional)
  - `to=YYYY-MM-DD` → do datuma (optional)
  - `realtime=true` → direktan query (default: false)

Response:
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-03-10",
      "totalReservations": 8,
      "totalRevenueRsd": 32000
    }
  ],
  "meta": {
    "realtime": false,
    "from": "2026-03-01",
    "to": "2026-03-31",
    "generatedAt": "2026-03-11T14:30:00Z",
    "count": 11
  }
}
```

### GET /reports/reservations
Paginirani listing rezervacija.

Query params:
  - `page=1` (default)
  - `limit=20` (max 100)
  - `status=CONFIRMED|CANCELLED` (optional)

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sourceReservationId": 42,
      "status": "CONFIRMED",
      "email": "john@example.com",
      "currency": "EUR",
      "finalPriceRsd": 5000,
      "finalPriceForeign": 42.50,
      "discountType": "BOTH",
      "discountAmountRsd": 500,
      "promoCodeApplied": "TRAC-AB12CD",
      "createdAt": "2026-03-10T10:30:00Z",
      "servicesCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 40,
    "totalPages": 2
  }
}
```

### GET /reports/sync-status
Status sinhronizacije iz A.1 — za monitoring.

Response:
```json
{
  "success": true,
  "data": {
    "totalProcessed": 42,
    "lastSuccessAt": "2026-03-11T14:28:00Z",
    "lastErrorAt": "2026-03-11T13:45:00Z",
    "lastError": "ReservationReport not found for source ID: 999"
  }
}
```

## Health Check
GET /health
```json
{
  "status": "ok",
  "service": "backend-a2-reporting",
  "timestamp": "2026-03-11T14:30:00Z"
}
```
