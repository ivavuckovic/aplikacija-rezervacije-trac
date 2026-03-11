# 🏗️ Provera arhitekture (Verification Checklist)

Ovaj dokument služi kao čeklista za sistemsku proveru pre pokretanja celokupnog softverskog okruženja.

## ✅ Pre pokretanja — Verifikaciona lista

### 1️⃣ Struktura monorepo arhitekture
Proverite prisustvo ključnih komponenti u pod-direktorijumima `packages`:
- `backend-a1` (Port 4000)
- `worker-a1` (Pozadinska obrada)
- `backend-a2` (Port 4001)
- `frontend-a1` (Port 3000)
- `frontend-a2` (Port 3001)

### 2️⃣ Docker kontejneri
Očekuje se podizanje tačno 9 kontejnera pri pokretanju:
- **Infrastruktura:** `postgres-a1` (oltp: 5432), `postgres-a2` (olap: 5433), `redis` (cache: 6379), `rabbitmq` (broker: 5672).
- **Aplikacije:** `backend-a1`, `backend-a2`, `worker-a1`, `frontend-a1`, `frontend-a2`.

### 3️⃣ Struktura baza podataka
- **PostgreSQL A.1 (Operativna baza):** Treba da sadrži 9 tabela (najbitnije su `reservations`, `services`, `salon_info`).
- **PostgreSQL A.2 (Baza za izveštaje):** Treba da sadrži 6 tabela (vizuelizovane denormalizovane strukture, npr. `category_stats`).

### 4️⃣ API krajnje tačke (Endpoints)
- **Backend A.1:** Trebalo bi da odgovara instanca na adresi `/health`. Rezervacije se evidentiraju preko `POST /api/reservations`.
- **Backend A.2:** Služi samo za uvid, nudi izveštaj poslovanja kroz endpoint `/api/reports/summary`.

### 5️⃣ Klijentske aplikacije (Frontend)
- **A.1 (Port 3000):** Namenjen građanima sa rutama: `/`, `/usluge`, `/rezervacija`, `/moja-rezervacija`.
- **A.2 (Port 3001):** Namenjen zaposlenima. Poseduje navigaciju za `/kategorije`, `/po-datumima`, `/rezervacije`.

### 6️⃣ Sistem za poruke (RabbitMQ)
U sklopu portala mora postojati exchange instanca `salon.events` (tipa `topic`). Redukcija zagušenja delegira neispravne eventove u the mrtvi red (Dead Letter Queue): `reservation.failed.queue`.

### 7️⃣ Sistem za keširanje (Redis)
Zauzetost memorije proverava se internom konzolom sa komandom `PING` (očekivani odgovor je `PONG`). Svi sistemski ključevi formiraju prefiks `trac:*`.

### 8️⃣ Konfiguracija (.env fajl)
Pregledajte `.env` datoteku i osigurajte postojanje validnog `EXCHANGE_RATE_KEY` dobijenog spoljnim servisom. 

---

## 📊 Automatizovan izveštaj
Proveru kompletnog predefinisanog orkestracijskog nivoa možete sprovesti brzo Unix shell skriptom:

```bash
#!/bin/bash
echo "=== IZVEŠTAJ O ARHITEKTURI ===" > report.txt
docker-compose ps --format "table {{.Service}}\t{{.Status}}" >> report.txt
echo "Gotovo. Pregledajte report.txt u radnom folderu."
```

✅ **Kada su svi preduslovi usklađeni navedenoj listi platformi – aplikacija je u pripravnosti za korišćenje.**
