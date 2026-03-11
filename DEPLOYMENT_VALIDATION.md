# 🔍 Vodič za validaciju uspešnog podizanja produkcije (Deployment Validation)

## OBAVEZNE PROVERE OKRUŽENJA (PRE-POKRETANJE)

### ✅ Stanje rutenskog nivoa (Root struktura fajlova)

Za uspešno oživljavanje sistema orkestrator i upravljački kod zahtevaju prisustvo na relaciji korenskog fajl-direktorijuma aplikacije:
- Presek postojanja centralnog `docker-compose.yml` na disku računara: **✅ Prošao proces dostupnosti.**
- `package.json` mora biti podešen isključivo za monorepo arhitekture pre povezivanja grana poddirektorijuma sa instaliranjem (`npm install` komplementiran sa zavisnim paketima): **✅ Preuzet i povezan na disku.**

### ✅ Arhitektura sloja - API servis operacija (Backend A.1) i Izveštajni analitičar za upravni dashboard API servis relacija statistikom (Backend A.2)

Ovi Node instancirani web ruteri obogaćeni su kroz kontejnerizovani obrazac po Docker praksama procesa na definisane statične operacije na standardizovana pravila (izolovani portovi pod dodacima internom proksi komunikacijom `4000` operacije nad naručiocima rezervacije, za obradu preuzet isključivo interfejs u servisu kod A.2 postavljenom redu na propusti na portu konfigurisanog panela na brojci `4001`).

**Dockerfile Multi-Stage (Za produkcije):** 
1. Prevod TypeScript logike, Prisma modela iz baze formacija kompiluje u komprimovan optimizovani i svedeno skraćen Javascript `Node.Js` standard kod na prvobitnom builder prenosnom okrugu okoline u formi Docker virtualne strukture memorije unutar fazne kontejnerske izrade.
2. Formuliše se druga cista instanca iznad smanjenim aplikacionim instalacijama u kom proces pod startovanja odradjuje bezbedne migracione promene pri bazi za poklapanja šuma (`npx prisma migrate deploy`), pratecen finalnom instrukcijom ispunjavanja inicijalizovanih osnovnih definisanih uslužnih polja podataka pod bazom i ubačenih popusta operacija pokretnim server kod okidačem rutera nad prekompiliranim paketima operatera pre okidanja mreže komunikacija preko internet priključaka konvencijom (`node dist/index.js`).

**Nadzorni modul detekcije server stanja i prepreke iz mrežnih padova asinhronije (Automatski Health Check portala):**
Puls i test propustljivosti obavlja iznutra okidač koji kuca server i detektuje da li se na putanji adresa odgovara isključivo po status kodu preusmeren sa bazne stranice adresiran iz rutera na upitu HTTP metida za posmatranje dostupnosti baze nad kovertovanim rutom `/health`. Konfiguraciona uputstva skeniraju u relaciju provere mreznih obrada pod uslovom pet ciklusa tolerisanja iz ponavljanja ispadanju greske sa ponovnim aktiviranjem kontejnerske restart obrade orkestracije. 

### ✅ Pozadinski operater dečijeg procesa kucanja poruke asinhronih logistickih relacija na poslu transakciji bez API interfejs mrežnih usluga sa direktnim pisačućim uputom komandi bazi bez zagušenja javnim uslužbama okline sajt portala korisnika (A.1 Worker Proces)

- Funkcionišuća skripta isključivo za depešu poslova koji pristižu na upit kod RabbitMQ kanala asinhrono ostavljenih na poslu broker uslužbi poslanih rezervativnih sesija pred transakcije pod okvirom "Subscriber/Consumer" razmene. Osluškiva portal mrežne interne virtualne kordinate rutera zadan na `rabbitmq://rabbitmq:5672` adresi. Poslovi ostavljeni za njega iz "reda za rezervacije koje samo čekaju konačnu transakciju" (`reservation.pending` po specifikaciji ključa imenovana u topologiji Rabbit okvira aplikacija). Obuhvata upis u obimni PostgreSQL A.1 sa strategijom formiranim i dizajniranim procesnim radnjama ponavljanju pri slučajnoj operaciji presretanja sa odbijanjima iz baze nad bazom pod usled smetnjama mreže (`Retry Logic` za spašavanjima rezervacije pred propad i u prenos statusa na red isključenih sesija padova - "Dead Letter Zone" pri isteku praga nakon trećeg bezuspešnog procesa obrade iste). On uspesan tok objavljiva pod dogadjajem dalje pri transakciji na Rabbit MQ topologii gde drugi sistem preuzima dogadaje kao osluskivac baze log tablicama A.2 sistema za statistiku uspesnosti platforme na portu analitike okvira. 

### ✅ Web paneli instrukcije - Korisnička klijent formacija Frontend A.1 za unos formata aplikacija na izvođenje operativnog booking modelarnog kalendara sistema porta na redom komandi 3000 i Upravni menadzerski sa analitikama rada panela 3001 kordinata Frontend portala 2. varijante. 

Ova dva React okvirom stvorena sistema dele zajedničku strategiju pri obezbeđivanih proksi modela kompilacije slike pre izvoenja na server kompozicione aplikacije unutar Nginx operativne distribucije prebačeni u "Single Page Web Aplikacija - SPA" okvir pre puštanja kod klijent pretrazivača internet kordinacija uz rutiranu formu pročišćavanja interakcije do mreže prebačen unutar `nginx.conf` pravila. Sve putanje prolaze sa zamenjivanjem operacijskog API server unosa iz Docker okruženja upušten u proksiranje domena kontejnerskih domena (`VITE_API_URL`) integracijskih putanja za vezu unutar React komandi instrukcija do rutine API servera unutrašnjosti mreža pozadinskih slojeva iz Docker staba. Koriste modernih obrazaca uslužbenika stanja i persist obrada podataka memorijalnog status sesija pred procesima (`zustand`, obimnih CSS modula oblika oblika sa komponentima pregleda instrukcija navigacije po aplikativnim putam kroz sistem formacija interfejs prepoznavanja UI). Frontend izbegava preskačuje ugradene rutine za izradu oblika panela preko biblioteka crteža (`Recharts` alat statistike komponentalni oblik vizuelija u formi pite za kategorijsku statistiku).

---

## 🚀 PRAKSA STARTA (DEPLOYMENT LOGIKA OPERATERA PRED PROVJERE POST-START OBIMA UTVRDIVANJA AKTIVNOSTI ZA PRODUKCIJOM RADA)

U ovome redoslede instrukcijski test po test proveravajte u komandama interfejs redovima za terminal na kucnim platformama izrade unutar kompjuterskoj okolini isključivo dok izvršavate iz komandnoj konzoli korenskog obima direktorijuma aplikativnih podataka:

I procesa (`KORAK BR. JEDAN I DVA PREKINETE`) i započeti instalacijama dodataka paketa pred postave rutine uz podešavanje kood konfiguracije .env:
```bash
npm install 
cp .env.example .env

# DODATI VREDNOST TAJNIM API POSTAVKAMA EXCHANGE PARAMETRIMA. ZATIM SACUVATI FORMAT STRUKTURE I KRENITE KOMANDNOM START FORMI DOCKER SISTEMA PREKO INSTALACIONOG RUN:
npm run docker:up
```

Redovne provere iz zdravstvenog obima baze interakcija (poslan zahtev izvan aplikacija pre test korisnickog vizuela podizanje rutine uspesne orkestracije interfejsom logistike baze nad pozivanjem baze odziva preuzet port na port HTTP upitnim protokolima za komandnom konzolom na adresi host aplikacije internoj okolini bez pretrazivackih unosa pred ulaz instanciranim bazama na sistemu rutiranja rutinom proveravaju okoline komandama curl operativna komanda paketa komponente OS platforme pre instalacija nad zahtevnim pregledom testnih upita koda okvira API testnih formacija porta pod komandi): 
```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
```

Zatraziti provere prisustva svih izradjenih instanciranih servisa (njih 9 preneseni po statusu UP konfiguracijama i bez procesnih ponavljanja kod pada "Restart" status iz baze zbog ciklusa pucanja relacija): 
```bash
docker-compose ps 
```

Pregled na komandoski Rabbit mrezni centar interfejs konzola uspesan u pregledacu iz adresnog panela upitom instrukcija rutiranja operacija (Na internet pregledacu na domen iz okoline test port host okoline unesite domen pristup na Rabbit mrezni pretraživace na host `http://localhost:15672` login na trac_rabbit po parametrima baze pod .env kolicnicima. Tu pregledate kreirane tablice razmene poruka od "Exchanges" pod modelirana pod salon.events parametrom za procese pred slanje mrezu obracanja radnika asinhrono) i baze redova pod "Queues". 

---

## 🔧 POSTUPCI PRED GREŠKIMA OKOLINE SISTEMA

### Zaleđen port sistem komunikacija (Greska komandi na adresi za start):
Neki softver ili prosli proces koji je zaustaljen silno ili isprepletano zadrzao komunikaciju po host resurs iz domena masinske instalacije OS drzi operacijskog port koda zaustavljen za isprepletene sisteme (`Port pre u upotrebi iz mreze` / `Port 3000 occupied`). Test pretrazivanjem za pid proces identifikata i prinudno rusite taj zaleđeni deo sistema:
Na Unik/Linuks OS pretragom za process `lsof -i :3000`. Zatrite silom ubici koda tog programa preko rutine ubij sistema `kill -9 {UNETPID}`. 

### Ruter interfejs podaci iz server baze relacija ispadaju a aplikacija ne podaci obimno ne mogu prikazani pre konekciona problema pri bazi Postgres aplikativa.

Na uočen status od baze Postgres API isputava logom "Database connection refused" pre iscitavanje tabele proveravaju upita se `docker-compose ps | grep postgres`. Iz iscitavanja log zapisa na mrezi pregledom "docker-compose logs postgres-a1" potvrdite grešku. Prebaciti popravljanje uz ručne korespodencije migracijne baze za podizace baze proces instalacione kordinacija za migraciju po Docker kanalu instancija servera bez rušenja celih proces sistema - kordinacijom okidanja iz okoline radnika terminala pokrenut kod "exec backend-a1 npx prisma migrate deploy" za relaciju sinhronijskih šema iznova po rušenja tabli ili nesinhorih polja po grešni konfiguraciji baze uz pozadinske promene od strane ormer servisa, prateći sa obaveznih instrukcija seed punjenja: "docker-compose exec backend-a1 npx prisma db seed"

Prekinuti celokupne proces i ubit bazu za podatke iz rada terminal okidač okvira po sistem relacija: `docker-compose stop` za cuvanje baze iz radne ciklusa uz cisto izbacivanje instanci `docker-compose down`. Na zahtev pred opšte resetovanja stanja baze pri haos radnji instalacijom aplikacija bez nade izvucenje reset na start is pocetka proces kucni `docker-compose down -v` radi na sve komandne uklon koda ukljucujuci tablice baze.
