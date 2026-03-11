# ✅ Čeklista pred pokretanje

## Obavezni koraci

- [ ] Kopiran `.env.example` u `.env` fajl.
- [ ] Popunjen `EXCHANGE_RATE_KEY` unutar `.env` (besplatan API ključ: https://www.exchangerate-api.com).
- [ ] Docker okruženje i Docker Compose su podignuti na sistemu.
- [ ] Zauzeti lokalni portovi su oslobođeni: `3000, 3001, 4000, 4001, 5432, 5433, 6379, 5672, 15672`.

## Pokretanje aplikacije

```bash
# 1. Instalacija svih npm zavisnosti iz monorepo rutine
npm install

# 2. Pokretanje kontejnera preko konfiguracije
npm run docker:up

# 3. Sačekajte ~30 sekundi za inicijalizaciju baza i kontejnera
# (Healthcheck statusi obezbeđuju pravilan redosled paljenja relacija i RabbitMQ reda)

# 4. Provera zdravlja bekenda
curl http://localhost:4000/health
curl http://localhost:4001/health

# 5. Pristup portalima
# Klijentski portal: http://localhost:3000
# Izveštajni panel (Reporting): http://localhost:3001
# RabbitMQ konzola: http://localhost:15672
```

## Provera prenešenih setova podataka (Seed verifikacija)

```bash
# Potvrda učitanih početnih podataka o salonu
curl http://localhost:4000/api/salon-info
curl http://localhost:4000/api/services

# Provera RabbitMQ razmene preko GUI web okruženja
# Posetite http://localhost:15672 → otvorite Exchanges tab → potvrdite postojanje "salon.events" i uspostavljanje njegovih propisanih redova
```

## Česti operativni problemi i rešenja

| Izbacivana ispisana greška | Rešenje |
|---------|----------|
| Prikazuje da je port prezauzet | Izvršite čišćenje porta: `docker-compose down` pa ponovo probajte `up` komandu |
| Prikazuje da Prisma migraciona baza nije sinhronizovana | Brzo ručno ispravite: `docker-compose restart backend-a1` |
| Uočeno da Broker razmena (MQ) ne prima poruke redom | Ispitajte Worker evidencije: `docker-compose logs worker-a1` |
| Greška na kalkulatoru konverzija | Istračite postojanost `EXCHANGE_RATE_KEY` taga u podešavanjima okoline |
| Prisma terminal vrati crvenu grešku | Pregazite ručnom orkestracijom `docker-compose exec backend-a1 npx prisma migrate deploy` |

---

## 📋 Lista završnog pregleda pre komercijalne isporuke koda (Production)

- [ ] Sve varijable su adekvatno ispunjene autentičnim ne-testnim lozinkama
- [ ] Migracioni kod obe relacionih mreža propustio se kroz `deploy` komande baze (ORM baze su stabilne po sinhronom statusu)
- [ ] Dinamički redovi `salon.events` unutar RabbitMQ su uspešno konstruisali veze i slušače
- [ ] Parametri keširanja su podešeni i isticanje Redis ključeva je operativno pod Time to Live pravilom (TTL periodi funkcionisu po protokolu)
- [ ] Usvojeni su bezbednosti Cross Policy (CORS) standardi razmene upita nad domenima i portovima
- [ ] Ispitana mreža padajućih propusta nad bazom u celokupnom radnom logu (`Error Handling`)
- [ ] Podrška evidentiranja radnji u terminalu (`Logging`) izvršava besprekorno čitanje stanja servera
- [ ] Dostupni MD prateci i Swagger specifikacija su ažurni
- [ ] Uspesno izvršen API simulativni stres test proces
- [ ] `docker-compose` samostalno detektuje smetnju internih baza pingovanjem usled zaleđivanja preko Docker Health Check instanci

---

> 🚀 Projekat sistema za praćenje je pouzdan za rad!
