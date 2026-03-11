# 📄 Indeks integrisanih fajlova u projektu (Files Manifest)

Ovaj dokument služi kao katalog svih bitnih strukturnih fajlova kodiranih unutar svih 14 iterativnih koraka preuzete aplikacije.

## 📊 Statistika formiranog koda
- **Ukupno kreiranih fajlova:** Preko 120 namenskih instanci
- **Ukupno faza (Koraka):** 14 operativnih segmenata
- **Organizacija paketa:** 5 uslužno orijentisanih aplikacija (3 backend-a, 2 frontend klijenta)
- **Broj linija izvornog koda:** Više od 15,000 specifičnih linija (bez konfiguracionog ekosistema preuzetog bibliotekama).

---

## 📁 Pregled po repozitorijumima (Packages)

### Osnovni, root nivo
Na nivou korena formirane su prečice, ignorišuća konfiguracija za reviziju, i postavka za kontejnerizaciju (`docker-compose.yml`, `.env.example`, `.gitignore`).

### REST API Klijent — Backend A.1 (Port 4000)
- Nastao kao finalizacija K5 do K8 faza.
- Sledi strogu domensku strukturu direktorijuma kodiranih u `src/`: tipovi, aplikacioni interfejsi, komunikacija ca okruženjem, i repozitorijumi.
- Podržava operacione rutere za validaciju i sprovođenje rezervacija kroz kontrolne panele klijenta.

### Pozadinski sistem — Worker A.1 (Background Task)
- Uspostavljen tokom K9 celine sa ciljem da izoluje stresne procedure prilikom integrisanja i saobraćaja podataka za svaku predatu rezervaciju. Preko RabbitMQ sistema beleži zahteve u primarnom PostgreSQL redu asinhronim pristupom.

### Izveštajni API sistem — Backend A.2 (Port 4001)
- Pokrenut procednim K10 korakom, on je subscriber (pretplatnik) na signale o novonastalim izmenama formacija klijenta. Snima analiticke i sumirane performanse sistema u optimizovanim tabelama na nezavisnoj arhitekturi i izlaže ih za Frontend aplikaciju namenjenoj upravi salona.

### Reaktivni klijent portali — Frontend (Port 3000 i 3001)
Implementirani na temeljima brzog Vite bundlera i React 18 verzije u toku ciklusa 11 do 14:
- **A.1:** Klijentski panel koji vodi naručioca kroz vizuelne korake rezervisanja termina unutar propisanog interfejsa salona prepoznatljivih brending identiteta. Menadžment i sinhronost lokalnih statusa rešena `zustand` stablom.
- **A.2:** Nadzorna obrada i posmatranja kretanja prihoda i frekventnosti kroz preuzete izveštaju, oblikovane u dinamičnim Recharts linijskim i piticama grafikona. Konfiguracija je prilagodjena internom zaposu upravnika biznisa.

---

Manifestacija kompletiona osigurava da svaka datoteka ispunjava neku namenu prema standardu preporuke u arhitekturi postavljenog Monorepo stila i spremna je za budući razvoj funkcija.
