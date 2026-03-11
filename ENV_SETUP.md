# Konfiguracija okruženja (Environment Setup)

Svi servisi unutar sistema koriste centralizovani `.env` fajl smešten u korenskom direktorijumu. Prilikom kloniranja projekta, obavezno kopirajte `.env.example` u `.env`.

## 📋 Ekološke promenljive po uslugama

### 1. Baze podataka (PostgreSQL)

Prilikom instalacije, sistem se oslanja na instanciranje dve odvojene Postgres baze:

**Operativna baza (A.1):**
```env
POSTGRES_A1_USER=trac_user
POSTGRES_A1_PASSWORD=trac_secret_a1
POSTGRES_A1_DB=trac_salon_db

# URL konekcija za Backend A.1:
DATABASE_URL=postgresql://trac_user:trac_secret_a1@postgres-a1:5432/trac_salon_db
```

**Baza za izveštaje (A.2):**
```env
POSTGRES_A2_USER=trac_user
POSTGRES_A2_PASSWORD=trac_secret_a2
POSTGRES_A2_DB=trac_reporting_db

# URL konekcija za Backend A.2:
BACKEND_A2_DATABASE_URL=postgresql://trac_user:trac_secret_a2@postgres-a2:5433/trac_reporting_db
```

### 2. Keširanje (Redis)

Broker uspostavljen u cilju ubrzavanja rada često čitanih resursa (valutne kalkulacije, podaci salona i stalne kategorije usluga).
```env
REDIS_URL=redis://localhost:6379
SALON_INFO_CACHE_TTL=3600
SERVICES_CACHE_TTL=600
EXCHANGE_RATE_CACHE_TTL=3600
```

### 3. Broker poruka (RabbitMQ)

Služi se topic-razmenama i posrednik je u obradi redova, primarno kod asinhronog izvođenja rezervacija.
```env
RABBITMQ_USER=trac_rabbit
RABBITMQ_PASSWORD=trac_rabbit_secret
RABBITMQ_URL=amqp://trac_rabbit:trac_rabbit_secret@localhost:5672
```

### 4. Spoljni API-ji (Exchange Rate)

Za prikaz i preračunavanje iznosa u različitim valutama odvojeno od lokalne dinarske referencije, obavezno je preuzimanje API ključa kroz aktivaciju besplatnog naloga sa [Exchangerate-api.com](https://www.exchangerate-api.com).
```env
EXCHANGE_RATE_KEY=vas_api_kljuc
EXCHANGE_RATE_BASE_URL=https://v6.exchangerate-api.com/v6
```

---

## 📥 Pravilno popunjavanje celokupnog `.env` fajla

1. Kopirajte ugrađeni standardni šablon komandom: `cp .env.example .env`
2. Izmenite nastali `.env` tekstualnim editorom dopunjavanjem potrebnog API ključa.
3. Potpuno konfigurisan dokument trebalo bi da manifestuje narednu strukturu:

```env
POSTGRES_A1_USER=trac_user
POSTGRES_A1_PASSWORD=trac_jaka_lozinka_a1
POSTGRES_A1_DB=trac_salon_db

POSTGRES_A2_USER=trac_user
POSTGRES_A2_PASSWORD=trac_jaka_lozinka_a2
POSTGRES_A2_DB=trac_reporting_db

REDIS_URL=redis://redis:6379
RABBITMQ_USER=trac_rabbit
RABBITMQ_PASSWORD=trac_rabbit_secret
RABBITMQ_URL=amqp://trac_rabbit:trac_rabbit_secret@rabbitmq:5672

EXCHANGE_RATE_KEY=upisani_kljuc_iz_veb_portala
EXCHANGE_RATE_BASE_URL=https://v6.exchangerate-api.com/v6

BACKEND_A1_PORT=4000
BACKEND_A1_DATABASE_URL=postgresql://trac_user:trac_jaka_lozinka_a1@postgres-a1:5432/trac_salon_db

BACKEND_A2_PORT=4001
BACKEND_A2_DATABASE_URL=postgresql://trac_user:trac_jaka_lozinka_a2@postgres-a2:5433/trac_reporting_db

SALON_INFO_CACHE_TTL=3600
SERVICES_CACHE_TTL=600
EXCHANGE_RATE_CACHE_TTL=3600

NODE_ENV=development
```

> **Napomene za korišćenje kroz Docker mrežu:**
> U `DATABASE_URL` segmentu bitno je konvertovati domene na DNS nazive dodeljenih kontejnera. Na primer umesto `localhost`, koristite imena poput `postgres-a1`, `postgres-a2`, `redis` i `rabbitmq`, kako bi ih orkestrator pravilno spajao unutar zaštićene izolaciono mrežne bridge klase.

---

## 🔐 Bezbednosna preporuka konfiguracije

- Vaš `.env` fajl mora zauvek ostati zatvoren pod lokalnom granom operativnog sistema i on je adekvatno zaštićen upotrebom standardnog ignores filtera u Git repozitorijumu projekta.
- Postavljajte složene, dugometražne lozinke. Obavezno izbegavajte specijalne karaktere URL parsera (poput simbola `@`, `#`, ili `$`) usled njihovih smetnji tokom raslojavanja stringova.
- Ako greškom ukomitujete `.env` u globalno stablo koda iskoristite prekidajuću komandu za brisanje istorija iz memorije staze: `git rm --cached .env` praćen potpisivanjem i prebrisavanjem na server putanji snimljenog `push --force`.
