# Backend A.1 — API Referenca

Base URL: http://localhost:4000/api

## Javni Endpointi

### Salon Info
GET    /salon-info                          Osnovne informacije (cached)

### Usluge
GET    /services                            Sve usluge po kategorijama (cached)
GET    /services/:id                        Jedna usluga
GET    /services/:id/available-slots        Slobodni termini
         ?date=YYYY-MM-DD

### Kurs Valute
GET    /exchange-rate                       Trenutni kurs
         ?target=EUR&base=RSD
GET    /exchange-rate/allowed-currencies    Dozvoljene valute

### Rezervacije
POST   /reservations                        Inicira rezervaciju (→ MQ)
GET    /reservations/status/:correlationId  Polling status
POST   /reservations/calculate-price        Preview cijene
GET    /reservations/my                     Detalji po šifri+email
         ?sifra=XXX&email=yyy
POST   /reservations/add-service            Dodaj uslugu
POST   /reservations/remove-service         Ukloni uslugu
POST   /reservations/cancel                 Otkaži rezervaciju

## Admin Endpointi (/api/admin/*)

PUT    /admin/salon-info                    Ažuriraj info salona

GET    /admin/categories                    Lista kategorija
POST   /admin/categories                    Kreiraj kategoriju
PUT    /admin/categories/:id                Ažuriraj kategoriju
DELETE /admin/categories/:id                Deaktiviraj kategoriju

GET    /admin/services                      Lista usluga
POST   /admin/services                      Kreiraj uslugu
PUT    /admin/services/:id                  Ažuriraj uslugu
DELETE /admin/services/:id                  Deaktiviraj uslugu

GET    /admin/currencies                    Lista valuta
POST   /admin/currencies                    Dodaj/ažuriraj valutu
PATCH  /admin/currencies/:code/toggle       Aktiviraj/deaktiviraj

GET    /admin/discount-config               Konfiguracija popusta
PUT    /admin/discount-config               Ažuriraj konfiguraciju

## Health Check
GET    /health                              Status servisa
