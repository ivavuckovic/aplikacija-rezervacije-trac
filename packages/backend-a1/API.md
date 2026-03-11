# Backend A.1 — API Referenca

Ovaj dokument je referentni pregled javnih i administrativnih ruta glavnog REST API sistema (A.1).
Bazna adresa aplikacije za mrežne klijente: `http://localhost:4000/api`

## Javne putanje pretrage (Endpoints)

### Informacije o salonu poslovanja
- `GET /salon-info` — Osnovni podaci salona (kovertuje se sistemski iz keš memorije brojanog radnika).

### Modeli pretrage usluga
- `GET /services` — Preuzima izlistane usluge grupisane po definisanim kategorijama i tarifama (takođe iz keša).
- `GET /services/:id` — Izlistava precizne detalje izdvojene specifične usluge baze.
- `GET /services/:id/available-slots?date=GGGG-MM-DD` — Za selektovani datum isporučuje pregled slobodnih termina za odabranu uslugu poslovanja po propisu vremense satnice salona.

### Kursne liste valuta operatera 
- `GET /exchange-rate?target=EUR&base=RSD` — Poziva aplikativni preračun po upitu iz integrisanih internet servisa ka obaveznom formatu vrednosti za strane korisnike narudžbine.
- `GET /exchange-rate/allowed-currencies` — Definisani spisak valuta koje uprava salona prima za rezervaciju u bazu.

### Interakcija asinhronog rezervacionog sistema (Upit nad podacima kalendara)
- `POST /reservations` — Otvara i inicira (stvara) rezervaciju kroz kontroler i asinhrono je prosleduje po logici reda poruka (MQ) preko događaja objave na Rabbit mrezni alat.
- `GET /reservations/status/:correlationId` — Osluškujuće prepoznavanje (Polling format pristupa) proknjižena obrađenim asinhronim procesima radnika u bazi usled izolovanog transakcionog okvira prihvatanja odobrene ugovorne relacije sa API procesa.
- `POST /reservations/calculate-price` — Informativan informativni prozor komercijalne isplate pretpostavkom presek valutanog prikaza baze zadanih metoda ugovorne strane.
- `GET /reservations/my?sifra=XXX&email=yyy` — Lični pregled specifične rezervacije prenetog identifikatora preko povratnog e-mail kontakta klijenta.
- `POST /reservations/add-service` — Aplikativno proširivanje odobrene i otvorene narudžbine preduzeća na operaciji pripojene dopunske pretrage unutrašnjeg menija za istu sesiju.
- `POST /reservations/remove-service` — Brisanje pojedinačno vezanog servisa za otvoren prozor narudžbine u dinarskoj bazi podataka salona pred sam izveštaj završetka kalendara prometa na dan usluge.
- `POST /reservations/cancel` — Priručno otkazivanje celokupne procesne transakcije i oslobađanje kalendara poslovanja pre vremena za navedenu zakazanu liniju. 

---

## Administrativni paneli ruta salona (`/api/admin/*`)

Rute uspostavljene iskljucivo menadžment okvire radi regulacije u operacijama API servisa (Zahteva se implementacija autenticije administrator nivoom pre produkcionog pustanja).
- `PUT /admin/salon-info` — Ažuriranje naziva preduzeća i primarnih poslovnih i informativnih obaveštenja po klijentu kroz preseceni red API usluge.
- `GET /admin/categories` — Pregled aktivno definisanih grana grupacija kategorija.
- `POST /admin/categories` — Stvaranje nove izolovano prazne kategorije sa atributima preko baze.
- `PUT /admin/categories/:id` — Promena asociranog naziva ili pozicije iste u bazi na vizuelni ruter.
- `DELETE /admin/categories/:id` — Presecanje veza uz ispis da je sakrivena ili poništavanje iste grupe po brisanju celog stabla servisa (deaktivacija elementa zbog veznih referenci modela da se ne kvari analiticki prihod za staru arhivsku mrežu ranijih rezervacija pri izveštaju preduzeca).

- `GET /admin/services` — Pregled kontrolnog formata u formi pojedinačnim ugovorenih usluga iz panela API struktura po redu unosa.
- `POST /admin/services` — Instaliranje servisa pri uvođenju noviteta cena usluge okoline ponude cenika klijentskom prikazu.
- `PUT /admin/services/:id` — Repozicioniranja, prepravke satnica vremena po prijemu obrade procesnih elemenata, menjanja operacinih cena servisa.
- `DELETE /admin/services/:id` — Povlačenje opcije iz cenika baze podataka rutine po ruter obradi nad transakcija server stanju A.1 upita (Smernica iskljucivanja istog).

- `GET /admin/currencies` — Prisutnost instaliranih valuta pod tabelama mrezinih preračuna sistema naplate kalendara.
- `POST /admin/currencies` — Uvrstavanje nove podržavanja inostrane usluge okidanja upitne cene servisa okvira za placanja servisa valute u platformskom pogledu.
- `PATCH /admin/currencies/:code/toggle` — Suspenzitovane ("On/Off") funkcionality uklanjanja opcija valute bez arhivskih greska baze preko SQL obrade formi pri zahtevu u rutine modelovanju formacija isključivanjima upada proces relacija i padom.
- `GET /admin/discount-config` — Očitavanje regulativa procentualne visini algoritamskih ugradenih opadajuca propusta propisa algoritama popusta sistema okidača iz vremenski intervalskih relacija ranijih zakanja naručilac po dogacajima od menadzera (Tipa procentualnog brojac isprogramiran po broju pređašnjeg unosa dana za upisna prijava kalendara pre vremena naplate radnim formacima salona.) 
- `PUT /admin/discount-config` — Konfiguracioni operateri postavki same priče strategije za popust aplikacionom prikazu formulo relacije.

---

## Oznaka održavanja vitalne mrežne API konzole sistema 
- `GET /health` — Operacija vrši upit prećutnog JSON odgovora u formata nadživljavanja koda rutera i isporukama okoline proces izvedbe za Docker proverama po pad aplikacije za okoline sistema na orkestracionih restart server metoda pri preklapanja smetkama platformi.
