# ✂ Salon Lepote "Trač" — Sistem za Rezervacije

Kompletna web aplikacija za rezervaciju termina u salonu lepote,
izgrađena kao monorepo sa 5 servisa i mikroservisnom arhitekturom.

---

## 📋 Sadržaj

- [Arhitektura](#arhitektura)
- [Tehnologije](#tehnologije)
- [Struktura projekta](#struktura-projekta)
- [Brzi start](#brzi-start)
- [Razvoj lokalno](#razvoj-lokalno)
- [Docker Compose](#docker-compose)
- [API Reference](#api-reference)
- [Environment varijable](#environment-varijable)
- [Prisma migracije](#prisma-migracije)

---

## 🏗 Arhitektura

```
┌──────────────────────┐ ┌──────────────────────┐
│ Frontend A.1         │ │ Frontend A.2         │
│ React/TS (3000)      │ │ React/TS (3001)      │
│ Klijenti salona      │ │ Menadžerski portal   │
└──────────┬───────────┘ └──────────┬────────────┘
           │ REST API       REST API │
           ▼                         ▼
┌──────────────────────┐ ┌──────────────────────┐
│ Backend A.1          │ │ Backend A.2          │
│ Express/TS (4000)    │ │ Express/TS (4001)    │
│ + Redis Cache        │ │ + MQ Subscriber      │
└──┬───────┬───────────┘ └──────────┬────────────┘
   │       │                        │
┌──▼──┐ ┌──────▼──────┐             │
│Redis│ │PostgreSQL    │             │
│Cache│ │(A.1 DB)      │             │
└──────┘ └─────────────┘             │
         │                           │
         ▼ PUBLISH                   │
┌──────────────────────┐             │
│ RabbitMQ             │◄────────────┘
│ salon.events         │
│ exchange (topic)     │
└──────────────────────┘
         ▲
         │
┌────────┴──────────────┐
│ Worker A.1            │
│ Background Consumer    │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ PostgreSQL (A.2 DB)  │
│ Reporting schema     │
└──────────────────────┘
```

**Varijanta arhitekture: C** — RabbitMQ message queue

---

## 🛠 Tehnologije

| Sloj | Tehnologija | Verzija |
|------|-------------|---------|
| Frontend | React + TypeScript + Vite | 18.x / 5.x |
| State management | Zustand | 4.x |
| Form validation | React Hook Form + Zod | 7.x / 3.x |
| Charts | Recharts | 2.x |
| Backend | Node.js + Express + TypeScript | 20.x |
| ORM | Prisma | 5.x |
| Baza podataka | PostgreSQL | 15 |
| Cache | Redis (ioredis) | 7 |
| Message Queue | RabbitMQ | 3.12 |
| HTTP Client | Axios | 1.x |
| Kontejnerizacija | Docker + Docker Compose | - |

---

## 📁 Struktura projekta

```
trac-salon/
├── docker-compose.yml                    # Orchestracija svih servisa
├── .env.example                          # Template za env varijable
├── .gitignore
├── README.md
└── packages/
    ├── backend-a1/                       # REST API + Redis cache
    │   ├── prisma/
    │   │   ├── schema.prisma             # DB shema A.1
    │   │   └── seed.ts                   # Inicijalni podaci
    │   └── src/
    │       ├── domain/                   # Tipovi
    │       ├── application/              # Servisi (business logic)
    │       ├── infrastructure/           # Repo, Redis, RabbitMQ
    │       └── presentation/             # Controllers, Routes
    │
    ├── worker-a1/                        # Background MQ processor
    │   ├── prisma/
    │   │   └── schema.prisma             # Identična A.1 shema
    │   └── src/
    │       ├── services/                 # ReservationWorkerService
    │       └── messaging/                # Consumer + Publisher
    │
    ├── backend-a2/                       # Reporting API + Subscriber
    │   ├── prisma/
    │   │   └── schema.prisma             # OLAP shema A.2
    │   └── src/
    │       ├── infrastructure/           # ReportingRepository
    │       ├── services/                 # SyncService
    │       ├── messaging/                # A2RabbitMQConsumer
    │       └── presentation/             # ReportingController
    │
    ├── frontend-a1/                      # Klijentska aplikacija
    │   └── src/
    │       ├── pages/                    # 4 stranice
    │       ├── components/               # Layout + UI + Reservation
    │       ├── services/                 # API pozivi
    │       ├── store/                    # Zustand stores
    │       └── types/                    # TypeScript tipovi
    │
    └── frontend-a2/                      # Reporting portal
        └── src/
            ├── pages/                    # Dashboard + 3 izvještaja
            ├── components/               # Layout (sidebar)
            ├── services/                 # Reporting API
            └── store/                    # Zustand store
```

---

## 🚀 Brzi start

### Preduvjeti

- Node.js >= 20
- Docker + Docker Compose
- npm >= 9

### 1. Kloniraj i instaliraj

```bash
git clone https://github.com/your-org/trac-salon.git
cd trac-salon

# Instaliraj sve zavisnosti (monorepo)
npm install
```

### 2. Postavi environment varijable

```bash
# Kopiraj template
cp .env.example .env

# Uredi .env fajl — dodaj exchange rate API ključ
# Besplatni API: https://www.exchangerate-api.com
nano .env
```

### 3. Pokreni sve servise

```bash
# Pokreni Docker Compose (baze, Redis, RabbitMQ + aplikacije)
npm run docker:up
```

### 4. Pristup aplikacijama

| Aplikacija | URL |
|------------|-----|
| 🧴 Klijentski portal | http://localhost:3000 |
| 📊 Reporting portal | http://localhost:3001 |
| 🔌 Backend A.1 API | http://localhost:4000 |
| 🔌 Backend A.2 API | http://localhost:4001 |
| 🐰 RabbitMQ UI | http://localhost:15672 |
| 🗄 Health A.1 | http://localhost:4000/health |
| 🗄 Health A.2 | http://localhost:4001/health |

**RabbitMQ pristup:** user/pass iz `.env` (`RABBITMQ_USER` / `RABBITMQ_PASSWORD`)

---

## 💻 Razvoj lokalno

Koristi se kada razvijate bez Docker-a.

### Pokrenite infrastrukturu samo

```bash
# Pokreni samo PostgreSQL, Redis, RabbitMQ
docker-compose up postgres-a1 postgres-a2 redis rabbitmq -d
```

### Prisma migracije

```bash
# Backend A.1 — kreiraj i primijeni migracije
cd packages/backend-a1
npx prisma migrate dev --name init
npx prisma generate

# Seed inicijalnih podataka
npx ts-node prisma/seed.ts

# Backend A.2 — reporting shema
cd ../backend-a2
npx prisma migrate dev --name init
npx prisma generate
```

Ili koristite npm skripte iz root-a:

```bash
npm run prisma:migrate:a1
npm run prisma:migrate:a2
```

### Pokrenite servise u razvoju

```bash
# Svaki u zasebnom terminalu:

# Terminal 1 — Backend A.1
npm run dev:backend-a1

# Terminal 2 — Worker A.1
npm run dev:worker-a1

# Terminal 3 — Backend A.2
npm run dev:backend-a2

# Terminal 4 — Frontend A.1
npm run dev:frontend-a1

# Terminal 5 — Frontend A.2
npm run dev:frontend-a2
```

---

## 🐳 Docker Compose

```bash
# Pokreni sve servise
npm run docker:up

# Zaustavi i ukloni volumes
npm run docker:down

# Rebuild specifičnog servisa
docker-compose up backend-a1 --build

# Pogledaj logove
docker-compose logs -f backend-a1
docker-compose logs -f worker-a1
docker-compose logs -f backend-a2

# Status svih servisa
docker-compose ps
```

---

## 📡 API Reference

### Backend A.1 (Port: 4000)

#### Salon Info

```http
GET /api/salon-info
```

Vraća osnovne informacije o salonu. Cached u Redis (3600s).

#### Usluge

```http
GET /api/services
GET /api/services/:id
GET /api/services/:id/available-slots?date=YYYY-MM-DD
```

#### Kursevi valuta

```http
GET /api/exchange-rate?target=EUR&base=RSD
GET /api/exchange-rate/allowed-currencies
```

#### Rezervacije

```http
POST /api/reservations              # Inicira rezervaciju
GET  /api/reservations/status/:id   # Polling status
POST /api/reservations/calculate-price
GET  /api/reservations/my?sifra=X&email=Y
POST /api/reservations/add-service
POST /api/reservations/remove-service
POST /api/reservations/cancel
```

#### Admin

```http
PUT    /api/admin/salon-info
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
GET    /api/admin/services
POST   /api/admin/services
PUT    /api/admin/services/:id
DELETE /api/admin/services/:id
GET    /api/admin/currencies
POST   /api/admin/currencies
PATCH  /api/admin/currencies/:code/toggle
GET    /api/admin/discount-config
PUT    /api/admin/discount-config
```

### Backend A.2 (Port: 4001)

```http
GET /api/reports/summary
GET /api/reports/by-category?realtime=true
GET /api/reports/by-date?from=YYYY-MM-DD&to=YYYY-MM-DD&realtime=false
GET /api/reports/reservations?page=1&limit=20&status=CONFIRMED
GET /api/reports/sync-status
```

---

## 🔑 Environment varijable

```env
# PostgreSQL A.1
POSTGRES_A1_USER=trac_user
POSTGRES_A1_PASSWORD=trac_secret_a1
POSTGRES_A1_DB=trac_salon_db

# PostgreSQL A.2
POSTGRES_A2_USER=trac_user
POSTGRES_A2_PASSWORD=trac_secret_a2
POSTGRES_A2_DB=trac_reporting_db

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_USER=trac_rabbit
RABBITMQ_PASSWORD=trac_rabbit_secret
RABBITMQ_URL=amqp://trac_rabbit:trac_rabbit_secret@localhost:5672

# ExchangeRate API (besplatno: https://www.exchangerate-api.com)
EXCHANGE_RATE_KEY=your_free_api_key
EXCHANGE_RATE_BASE_URL=https://v6.exchangerate-api.com/v6

# Cache TTL (sekunde)
SALON_INFO_CACHE_TTL=3600
SERVICES_CACHE_TTL=600
EXCHANGE_RATE_CACHE_TTL=3600
```

---

## 🗃 Prisma migracije

```bash
# Generisanje Prisma klijenta (bez migracije)
cd packages/backend-a1 && npx prisma generate
cd packages/backend-a2 && npx prisma generate
cd packages/worker-a1  && npx prisma generate

# Kreiranje nove migracije
cd packages/backend-a1
npx prisma migrate dev --name naziv_migracije

# Primjena migracija na produkciji
npx prisma migrate deploy

# Prisma Studio (GUI za bazu)
cd packages/backend-a1 && npx prisma studio  # Port 5555
cd packages/backend-a2 && npx prisma studio  # Port 5556

# Seed podataka
cd packages/backend-a1
npx ts-node prisma/seed.ts
```

---

## 🔄 RabbitMQ Exchange topology

```
Exchange: salon.events (topic, durable)

Routing Keys:
  reservation.pending   → reservation.pending.queue      (Worker A.1)
  reservation.created   → reservation.created.reporting  (Backend A.2)
  reservation.updated   → reservation.updated.reporting  (Backend A.2)
  reservation.cancelled → reservation.cancelled.reporting (Backend A.2)
  reservation.failed    → reservation.failed.queue        (DLQ)

Dead Letter:
  Exchange: salon.events.dlx
  Queue:    reservation.failed.queue
  TTL:      30s po poruci
  Max retry: 3 pokušaja
```

---

## 📊 Baze podataka

### A.1 — Operativna baza (PostgreSQL :5432)

| Tabela | Opis |
|--------|------|
| salon_info | Informacije salona (singleton) |
| service_categories | Kategorije usluga |
| services | Usluge sa parametrima termina |
| allowed_currencies | Dozvoljene valute |
| discount_config | Konfiguracija vremenskog popusta |
| reservations | Rezervacije (centralna tabela) |
| reservation_services | M:N — rezervacije/usluge |
| promo_codes | Promo-kodovi |
| reservation_errors | Log neuspješnih rezervacija |

### A.2 — Reporting baza (PostgreSQL :5433)

| Tabela | Opis |
|--------|------|
| reservations_report | Kopija rezervacija za izvještaje |
| reservation_services_report | Kopija usluga po rezervaciji |
| categories_snapshot | Snapshot kategorija iz A.1 |
| daily_stats | Pre-agregirana dnevna statistika |
| category_stats | Pre-agregirana statistika po kategoriji |
| sync_events | Log obrađenih MQ eventi (idempotentnost) |

---

## 🧪 Testiranje API-ja (primjeri)

```bash
# Health check
curl http://localhost:4000/health

# Salon info (Redis cached)
curl http://localhost:4000/api/salon-info

# Sve usluge
curl http://localhost:4000/api/services

# Slobodni termini (zamijeni datum)
curl "http://localhost:4000/api/services/1/available-slots?date=2025-12-20"

# Kurs EUR
curl "http://localhost:4000/api/exchange-rate?target=EUR"

# Kalkulacija cijene
curl -X POST http://localhost:4000/api/reservations/calculate-price \
  -H "Content-Type: application/json" \
  -d '{"serviceIds":[1,2],"currency":"EUR"}'

# Kreiranje rezervacije
curl -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "personalData": {
      "ime":"Marija","prezime":"Petrović",
      "email":"marija@example.com",
      "adresa":"Bulevar 42","postanskiBroj":"21000",
      "mesto":"Novi Sad","drzava":"Srbija"
    },
    "services": [{"serviceId":1,"slotDatetime":"2025-12-20T09:00:00.000Z"}],
    "currency": "EUR"
  }'

# Reporting summary
curl http://localhost:4001/api/reports/summary

# Statistika po kategoriji (realtime)
curl "http://localhost:4001/api/reports/by-category?realtime=true"

# Statistika po datumima
curl "http://localhost:4001/api/reports/by-date?from=2025-01-01&to=2025-12-31"
```

---

## 👥 Tim i licenca

Projekat razvijen u svrhu akademskog projektnog zadatka.

- **A.1** — Aplikacija za rezervaciju termina u salonu lepote "Trač"
- **A.2** — Portal za izveštavanje
- **Arhitektura** — Varijanta C (RabbitMQ)

---

**Hvala što koristiš Salon Trač! 💇‍♀️✂️**
