# ✂ Salon lepote "Trač" — Sistem za rezervacije

Kompletna veb aplikacija za rezervaciju termina u salonu lepote, izgrađena kao monorepo sa 5 servisa i mikroservisnom arhitekturom.

---

## 📋 Sadržaj
- [Arhitektura](#arhitektura)
- [Tehnologije](#tehnologije)
- [Struktura projekta](#struktura-projekta)
- [Brzi start](#brzi-start)
- [Lokalni razvoj](#lokalni-razvoj-bez-docker-a)
- [Docker Compose komande](#docker-compose-komande)
- [API referenca](#api-referenca)
- [Konfiguracija okruženja](#konfiguracija-okruženja)
- [Prisma migracije](#prisma-migracije)

---

## 🏗 Arhitektura

```text
┌──────────────────────┐   ┌──────────────────────┐
│ Frontend A.1         │   │ Frontend A.2         │
│ React/TS (3000)      │   │ React/TS (3001)      │
│ Klijentski portal    │   │ Menadžerski portal   │
└──────────┬───────────┘   └──────────┬───────────┘
           │ REST API                 │ REST API
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│ Backend A.1          │   │ Backend A.2          │
│ Express/TS (4000)    │   │ Express/TS (4001)    │
│ + Redis Cache        │   │ + MQ Subscriber      │
└──┬───────┬───────────┘   └──────────┬───────────┘
   │       │                          │
┌──▼──┐ ┌──▼───────────┐              │
│Redis│ │PostgreSQL    │              │
│Cache│ │(A.1 DB)      │              │
└─────┘ └──────────────┘              │
           │                          │
           ▼ PUBLISH                  │
┌──────────────────────┐              │
│ RabbitMQ             │◄─────────────┘
│ salon.events         │
│ exchange (topic)     │
└──────────────────────┘
           ▲
           │
┌──────────┴───────────┐
│ Worker A.1           │
│ Background Consumer  │
└──────────────────────┘
           │
           ▼
┌──────────────────────┐
│ PostgreSQL (A.2 DB)  │
│ Reporting schema     │
└──────────────────────┘
```

**Arhitekturni obrazac: C** — Upotreba reda za poruke (RabbitMQ).

---

## 🛠 Tehnologije

| Sloj | Tehnologija | Verzija |
|------|-------------|---------|
| Frontend | React + TypeScript + Vite | 18.x / 5.x |
| Upravljanje stanjem | Zustand | 4.x |
| Validacija formi | React Hook Form + Zod | 7.x / 3.x |
| Grafikoni | Recharts | 2.x |
| Backend | Node.js + Express + TypeScript | 20.x |
| ORM | Prisma | 5.x |
| Baza podataka | PostgreSQL | 15 |
| Keširanje | Redis (ioredis) | 7 |
| Broker poruka | RabbitMQ | 3.12 |
| HTTP klijent | Axios | 1.x |
| Kontejnerizacija | Docker + Docker Compose | - |

---

## 📁 Struktura projekta

```text
trac-salon/
├── docker-compose.yml                    # Orkestracija servisa
├── .env.example                          # Šablon za env varijable
└── packages/
    ├── backend-a1/                       # REST API + Redis keš (Klijenti)
    ├── worker-a1/                        # Background MQ procesor (Obrada rezervacija)
    ├── backend-a2/                       # Reporting API + Subscriber (Izveštavanje)
    ├── frontend-a1/                      # Klijentska React aplikacija
    └── frontend-a2/                      # Menadžerski React portal (Reporting)
```

---

## 🚀 Brzi start

### Preduslovi
- Node.js >= 20
- Docker + Docker Compose
- npm >= 9

### 1. Kloniranje i instalacija
```bash
git clone https://github.com/your-org/trac-salon.git
cd trac-salon
npm install
```

### 2. Konfiguracija okruženja
```bash
cp .env.example .env
# Dodajte EXCHANGE_RATE_KEY u .env fajl (besplatan ključ sa: https://www.exchangerate-api.com)
```

### 3. Pokretanje sistema
```bash
npm run docker:up
```

### 4. Pristupi servisima
- 🧴 **Klijentski portal:** http://localhost:3000
- 📊 **Reporting portal:** http://localhost:3001
- 🔌 **Backend A.1 API:** http://localhost:4000
- 🔌 **Backend A.2 API:** http://localhost:4001
- 🐰 **RabbitMQ UI:** http://localhost:15672 (user/pass definisan u `.env`)

---

## 💻 Lokalni razvoj (bez Docker-a)

1. **Pokretanje infrastrukture:**
   ```bash
   docker-compose up postgres-a1 postgres-a2 redis rabbitmq -d
   ```
2. **Migracije i ubacivanje početnih podataka:**
   ```bash
   npm run prisma:migrate:a1
   npm run prisma:migrate:a2
   ```
3. **Pokretanje servisa u zasebnim terminalima:**
   ```bash
   npm run dev:backend-a1
   npm run dev:worker-a1
   npm run dev:backend-a2
   npm run dev:frontend-a1
   npm run dev:frontend-a2
   ```

---

## 🐳 Docker Compose komande

```bash
npm run docker:up                   # Pokretanje svih servisa
npm run docker:down                 # Zaustavljanje servisa i brisanje kontejnera
docker-compose up backend-a1 --build # Ponovna izgradnja određenog servisa
docker-compose logs -f backend-a1    # Praćenje logova
docker-compose ps                   # Status aktivnih kontejnera
```

---

## 📡 API referenca

### Backend A.1 (Port 4000)
- `GET /api/salon-info` – Informacije o salonu (keširano)
- `GET /api/services` – Dostupne usluge (keširano)
- `GET /api/services/:id/available-slots?date=YYYY-MM-DD` – Slobodni termini za uslugu
- `GET /api/exchange-rate` – Konverzija valuta
- `POST /api/reservations` – Kreiranje nove rezervacije
- `GET /api/reservations/status/:id` – Polling status rezervacije
- Administracija (`/api/admin/*`): Upravljanje kategorijama, uslugama i valutama.

### Backend A.2 (Port 4001)
- `GET /api/reports/summary` – Zbirni izveštaj poslovanja
- `GET /api/reports/by-category?realtime=true` – Statistika po kategorijama
- `GET /api/reports/by-date` – Izveštaji filtrirani po datumu

---

## 🔄 RabbitMQ topologija
- **Exchange:** `salon.events` (tip: `topic`, `durable`)
- **Routing ključevi:** `reservation.pending`, `reservation.created`, `reservation.updated`, `reservation.cancelled`, `reservation.failed`
- **DLQ (Dead Letter Queue):** `reservation.failed.queue` za neuspešne događaje sa automatskim ponavljanjem (3 pokušaja, TTL 30s).

---

## 📊 Baze podataka
- **A.1 (Operativna, Port 5432):** Čuva real-time podatke (usluge, rezervacije, cenovnike, konfiguracije popusta).
- **A.2 (Reporting, Port 5433):** Optimizovana za izveštavanje; čuva pre-agregirane podatke (dnevna statistika, sinhronizovani snapshots).

---

## 🧪 Testiranje (Primeri poziva)

```bash
# Provera zdravlja servisa
curl http://localhost:4000/health

# Citanje slobodnih termina za određeni datum
curl "http://localhost:4000/api/services/1/available-slots?date=2025-12-20"

# Kalkulacija cene usluge u stranoj valuti
curl -X POST http://localhost:4000/api/reservations/calculate-price \
  -H "Content-Type: application/json" \
  -d '{"serviceIds":[1,2],"currency":"EUR"}'
```
