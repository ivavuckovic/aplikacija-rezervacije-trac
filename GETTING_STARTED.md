# Brzi vodič za pokretanje (Getting Started)

Ovaj vodič objašnjava proces lokalnog podizanja celokupnog sistema "Salon lepote Trač".

## ⏱️ Vreme potrebno za pokretanje: ~5 minuta

### Zahtevi
- Instaliran Docker i Docker Compose.
- Besplatan API ključ za klijentske kurseve valuta (ExchangeRate-API).
- Slobodni lokalni portovi: `3000, 3001, 4000, 4001, 5432, 5433, 6379, 5672, 15672`.
- Preporučeno ~8GB RAM memorije za nesmetan rad kontejnera.

---

## 📋 Brzi start (1 minut)

1. **Pozicionirajte se u repozitorijum:**
   ```bash
   cd "C:\Users\Aleksa\Desktop\IIS projekat\Rad\aplikacija-rezervacije-trac"
   ```
   
2. **Konfigurišite okruženje:**
   ```bash
   cp .env.example .env
   ```
   *Otvorite `.env` fajl i unesite `EXCHANGE_RATE_KEY` (ključ možete besplatno preuzeti sa `https://www.exchangerate-api.com`).*

3. **Instalirajte zavisnosti (monorepo root):**
   ```bash
   npm install
   ```

4. **Pokrenite sistem u Docker-u:**
   ```bash
   npm run docker:up
   ```

5. **Pristup (nakon ~30 sekundi inicijalizacije):**
   - **Frontend portal (klijenti):** http://localhost:3000
   - **Izveštaji (menadžment):** http://localhost:3001

---

## 🧪 Testiranje rezervacije

Nakon podizanja sistema, možete isprobati kreiranje testne rezervacije putem API-ja:

```bash
curl -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "personalData": {
      "ime": "Marko", "prezime": "Marković",
      "email": "marko@example.com",
      "adresa": "Njegoševa 123", "postanskiBroj": "11000",
      "mesto": "Beograd", "drzava": "Srbija"
    },
    "services": [{"serviceId": 1, "slotDatetime": "2025-12-20T09:00:00Z"}],
    "currency": "RSD"
  }'
```

Očekivani odgovor sistema je uspeh (HTTP 200) i dodela statusa `PENDING` uz generisanje jedinstvenog `correlationId`-a. Centralna obrada se potom uspešno obavlja asinhrono u pozadini prekog RabbitMQ redova.

---

## 🐛 Rešavanje čestih problema (Troubleshooting)

**1. Port je već zauzet ("Port already in use")**
Pronađite i ručno zaustavite proces na Windowsu koji koristi pogođeni lokalni port, ili promenite levo mapiranje porta u `docker-compose.yml` (`VAS_PORT:KONTEJNER_PORT`).

**2. Backend nema konekciju ka bazi ("Cannot connect to database")**
Proverite `DATABASE_URL` format u `.env` fajlu i obezbedite da su Postgres kontejneri pokrenuti (`docker-compose ps`). Prema potrebi, ručno primenite Prisma migracije za baze aplikacije:
```bash
docker-compose exec backend-a1 npx prisma migrate deploy
```

**3. Frontend aplikacija je prazna / nema podatke**
Prvo proverite da li je uopšte pokrenut backend: `curl http://localhost:4000/health`. Ukoliko API radi ali frontend odbija učitavanje, preporučujemo rekompajliranje klijentskog Docker kontejnera:
```bash
docker-compose up -d --build frontend-a1
```

---

## 🛑 Zaustavljanje servisa

```bash
# 1. Zaustavljanje svih servisa (čuva postojeće relacione podatke baze i RabbitMQ cache)
docker-compose stop

# 2. Zaustavljanje uz brisanje kontejnera (bezbedno oslobađa mrežu, čuva volumes podatke)
docker-compose down

# 3. Kompletno brisanje kontejnera i baze (**OPREZ: briše sve fajlove i tabele u potpunosti!**)
docker-compose down -v
```
