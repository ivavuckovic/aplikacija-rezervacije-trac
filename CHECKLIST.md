# ✅ Checklist pred pokretanjem

## Obavezno

- [ ] Kopiran `.env.example` u `.env`
- [ ] Popunjen `EXCHANGE_RATE_KEY` u `.env`
        (besplatno na https://www.exchangerate-api.com)
- [ ] Docker Desktop pokrenut
- [ ] Port 3000, 3001, 4000, 4001, 5432, 5433,
        6379, 5672, 15672 slobodni

## Pokretanje

```bash
# 1. Instaliraj zavisnosti
npm install

# 2. Pokreni Docker Compose
npm run docker:up

# 3. Pričekaj ~30s da se sve inicijalizira
# (healthcheck-ovi osiguravaju redosljed pokretanja)

# 4. Provjeri zdravlje servisa
curl http://localhost:4000/health
curl http://localhost:4001/health

# 5. Pristupi aplikacijama
# Klijentski portal: http://localhost:3000
# Reporting portal: http://localhost:3001
# RabbitMQ UI: http://localhost:15672
```

## Provjera podataka

```bash
# Provjeri seed podatke
curl http://localhost:4000/api/salon-info
curl http://localhost:4000/api/services

# Provjeri RabbitMQ exchange
# http://localhost:15672 → Exchanges → salon.events
```

## Tipični problemi

| Problem | Rješenje |
|---------|----------|
| Port zauzet | `docker-compose down` pa ponovo `up` |
| Baza ne sinhronizirana | `docker-compose restart backend-a1` |
| MQ ne prima poruke | Provjeri Worker logove: `docker-compose logs worker-a1` |
| Exchange rate greška | Provjeri API ključ u `.env` |
| Prisma greška | `docker-compose exec backend-a1 npx prisma migrate deploy` |

---

## 📋 Završni pregled prije produkcije

- [ ] Sve .env varijable popunjene
- [ ] Database migracije sve primijenjene
- [ ] RabbitMQ queue-ovi i exchange-ovi kreirani
- [ ] Redis cache brisanja implementirane
- [ ] CORS politika konfigurirana
- [ ] Error handling u svim servisima
- [ ] Logging implementiran
- [ ] API dokumentacija ažurna
- [ ] Svi testovi prosljeđeni
- [ ] Docker Compose health-checkovi rade

---

**Sveća pokretanja! 🚀**
