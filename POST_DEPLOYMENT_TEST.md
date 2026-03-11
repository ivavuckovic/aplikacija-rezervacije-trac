# 🧪 Vodič za validaciju ponašanja operacije kod postavljenom sistem formacija mreže (Post-Deployment Test)

Kada prevod komandni deo za formaciju Docker Compose celog sloja aplikacije uspesno komandnim procesom završi podizanje (`docker-compose up`), provuci sistem formacije testa kroz sve integrisane arhitekturne čvornice kako bi validirali "pošiljka-do-primanja obrisi prenetnih stanja - End 2 End radnje izvedbe".

---

## Faza 1: Rutina arhitekturnih integracija pregleda platformskih mreza (5 do 7 min)

### Stanje u start podignutom modulu broja alata za operaciona postava proces instanca
Za nadzor iz komandni terminal upišete:
```bash
docker-compose ps
```

✅ Kriterijum prohodnih komandi za potvrđivanje stanja: Preko ispisanih lista u poljima svi prisutni kontejner status kolona (od postgres-a1 do frontend-a2, ukupnim brojevima od 9 radna sistema instanciju koda) moraju nositi ispise isključivo presek radnih parametara "Up", uz opcioni deo "healthy". 

### Funkcije pregleda na API instanci HTTP porta prozirne odgovorne propustanja adresa baze testnih metoda ("Health") za backend slojeve iz A.1 u A.2
Test operater nad adresa rutama zahtevnim putem terminal upućaje interpunkcije ka host parametrima server proces metoda po bazi HTTP pravila kroz integrisane adrese komandi iz CLI alat terminal kompjutanih zahteva `curl`:
```bash
curl http://localhost:4000/health
# Prateći istu preveru operacija za 4001 pod API A.2 logiku baze izveštaja:
curl http://localhost:4001/health
```

✅ Postupak potvrden na bazi povraćaj kod klijenta json model operacionih funkcija sa iskazanom povratnom preporukom uspešna `{ "status": "ok" }`.

### Potvrda internih komandnih kanala i operisanih konekciona pre Postgres alata instanca na bazi koda SQL prepozitorni operativnu komandi zahteva testa "1" za prolaz ping upita. 
Odgovaranje i test propusta operacije unutar docker baza:
```bash
# Sprovodenje komandi za bazne procese operativnih A.1 baza rezervisanoj okolini
docker-compose exec postgres-a1 psql -U trac_user -d trac_salon_db -c "SELECT 1;"
docker-compose exec postgres-a2 psql -U trac_user -d trac_reporting_db -c "SELECT 1;"
```
✅ Odazivna matrica kolone koda brojkom komandi na internoj terminal podloga isprintana za tabelom red ispisu `1`.

### Redis Ping na prenos prebrodanju okvira operacije kontejnerskim interfejs testom obimnoj bazne platforme memorija u cache:
```bash
docker-compose exec redis redis-cli ping
```
✅ Interaktivna ispis poruka prenesenog Redis protokola: "PONG"

---

## Faza 2: Pristupanje proverom podataka funkcionalnom REST test API mreza kontrolnih ruter domena interfejs operacija baza instanca (10 min rada testa)

U procesu slanja dobijaju se JSON strukture. Prvo uzimanjem servira osnovnu kategoriju u JSON podatka o salon stanju ("GET /api/salon-info"):
```bash
curl http://localhost:4000/api/salon-info
```
✅ Kriterijum: Iscitavanje pod parametarsku opcioni kljuc "naziv": "Salon Lepote Trač". Svi detaljni ispunjeni blok podaci radnje poslovanju lokacija upis.

Dohvat svih popisa iz kataloga uslužbe rutera metoda u nizovima ("GET /api/services"):
```bash
curl http://localhost:4000/api/services
```
✅ Kriterijum: Kroz JSON model prihvata se unutar atribut bloka naziva 'data' veliki instancirani red niza ponuđenih usluga iz prenesene tablice startnih sema ('seed') baza, zapocet uslugama 'Šišanje' iz indeks podataka ID brojem.

Provera API eksternih usluzja nad kordinatama u menadzerskih pretvaranje u vrednosti za obradu valutanog API kljuca za razmene stranice iz `.env`:
```bash
curl "http://localhost:4000/api/exchange-rate?target=EUR"
```
✅ Odgovor vraćen na format iz EUR pretplata operacije u polju timestamp i rate matematicki propust sa ispunjeni "base" RSD osnovim uslovno pretvaranjem i HTTP procitom. Odlika testa ispravne konvencije integracija nad izlazni pretplatu usluge "Exchangerate-api".

Sprovodjenje integracija na backend komandne port baze servisa (za backend log izveštaj pod port 4001 kordinata rutera u statističkih summary ruta putanja `/api/reports/summary`).
```bash
curl http://localhost:4001/api/reports/summary
```
✅ Daje osnovni podaci startovanja od ispunjenih null/nuliranje stanja od početaka za bazu u JSON okruženju zbog izostanka klijent sesija transakcionom upis podataka: tipa "totalReservations: 0". 

---

## Faza 3: Izložnost mrežnih interfejs SPA stranicima kod VITE izbornika Frontend port aplikativa (Provera FrontEnd UI kontejner - 5 min rada)

Za osiguranje Nginx kanala obezbeđenja port na mreznom delu rutera 3000 i red port kucna mrežnog analitičar na port kordinata ruter za 3001 kucate unutar pregled na "curl" proksi bez iscrtavanja celokupne vizuelja kod HTTP rutiranjem, ispravnu izbacuju prve linijskog HTML ispisa koda komande:
```bash
# Na rezervacioni interfejs port komandi:
curl -s http://localhost:3000 | head -20

# Izrada pregovora ka port mreži analitičke osmatranice:
curl -s http://localhost:3001 | head -20
```
✅ Potvrđen status prelazi standard obaveza u uocavanju operacionu HTML glavu `<title>Salon Lepote Trač</title>` u prvo iscitavane sajt element, sa drugom obavezom prijavice okoline react prepozavanje div model u HTML element ugradjen preko staba okruzju: `<div id="root"></div>`. Isti slucajna pri aplikaciji na port adresi za 3001 aplikaciji rute analiticnog sajta `<title>Salon Trač — Reporting Portal</title>`.

---

## Faza 4: Ekstrakcijom rutine transakcionom simulacije rezervaciji asinhronog rada od početak do propusta analiticim izvora u radne baza pod redom iz logistika testa (Ovo je srž funkcionalnosti koda! Test faza oko 10 min komandi):

Simulativno bacate zahtjev za aplikacionem formiranjem na izrade JSON struktuirana podataka preko zahteva od rutine koda za ruter metode nad POST API operacionom upitu pod server A.1 pod port operativi mrezne putanja:

```bash
curl -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "personalData": {
      "ime": "Testiranje",
      "prezime": "Uspešan",
      "email": "test@primer.com",
      "adresa": "Lokalni Mreža ulica 11",
      "postanskiBroj": "1000",
      "mesto": "Beograd",
      "drzava": "Srbija"
    },
    "services": [
      {
        "serviceId": 1,
        "slotDatetime": "2025-12-25T11:00:00Z"
      }
    ],
    "currency": "RSD"
  }'
```

✅ U slučaju ispravne simulativne matrice iz HTTP odgovor za povrat iz polja aplikacije pod rutinom ispada u formaciji prihvaten za upite (202 Accepted kod na server glave porta), dok u JSON telo izlači pod okretnom poruko status na parametar isključivo ka `"PENDING"`, i najvise relevantnoj dodela automatski format generisana ključ u format iz UUID alata za asinhroni praćenja okvira u "correlationId" delu, kopirajte isplavile kordinate u sledeći komandi. Sprečeni ste da u istoj simulirani metodi podignete u "POTVRDJENA/CONFIRMED" bez radnicke ucesca. Sistem upućaje redom signal Rabbit broker redu u cekanja bez blokiranje port mrezu. Klijenu javlja ok potvrdeni format za prijem.

Sačekavši malo rad baze Worker servisa asihrona procesna pretraga testom (Upotrebli ispraceni UUID kordinat dodeljenih pređašnji deo upisan sa komandi test rutiranja ka `status/` endponta):
```bash
# Na mestu taga X zamenjite correlationID kordinata kopirujuci:
curl http://localhost:4000/api/reservations/status/XXXXXXX-XXXX-XXXX-XX
```
✅ Aplikacija servise pretragu na stanju pretrage asihrona operativnih procesnih radnika baze promeni "status" na usmerena u `"CONFIRMED"` parametrima za obradu. Takodje propusta format baze "sifra" nad propisane modele `TRAC-XXXXX` model relacija unutar JSON kod povracajne instrukcija formata za transakcionem odobranjem operacije po radnika redu uspesnim kod u komandi odgovara HTTP port niza. Pratiti mogucu uvid logike iz terminal instrukcijama Worker kanala i na `sumary` reporting okruženju analitičke tablice na A.2 (očekuje promenu na `"totalReservations": 1` posle uspesnog azuriranja asinhrona MQ signala sa reporting port baze na prenet presecen iz "reservation.created" topiku is Rabbit reda preuzetog kod radnik izvestaja servisa.)

Za namerno ispustanje i kršenje validator pravnog unosa parametara usred testa (Provera sistema bezbednosti u polje i pad u bazi od operativnom grešaka nad baznim model validator):
```bash 
# Gde ne pošaljete u modelu "prezime" parametara pod uslovnim post API rutinom:
curl -X POST http://localhost:4000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{ "personalData": { "ime": "Testiranje" }, "services": [] }'
```
✅ Odgovaro API blokada prelaz na kontrolisanim i bezbednom grešni instrukcijama uz HTTP 400 Bad Request bez ruseci aplikaciju za backend, u izveza grešnom JSON bloku isticeno napad poruke da Zod paket prepozanje gresni i ispadani iz strukture. `"error": "Validacija greške:..."`.

---

**Cestitanje! Zavrsetkom i prodjene svi provera aplikativnih uslovi su zavrsena a "Salon Trač" kod funkcionisan ispunuje zaheve stabilanosti celokupni koda arhitekture projekti! ✨**
