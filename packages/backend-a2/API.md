# Backend A.2 — Reporting API (Analitika preduzeća)

Ova struktura ruta posvećena je analitičkom mikroservisu koji obrađuje ranije spakovane podatke asinhronih klijentskih prebacivanja. Dizajnirane isključivo za vizuelni fronted prikaz mrežnog interfejs panela nad podacima zaposlenja. 
Adresa podizanja lokalne okoline: `http://localhost:4001/api`

## Skup izveštajnih krajnjih mrežnih kontrolera (Reporting Endpoints)

### Zbirna statistika zaglavlja baze (Dashboard Summary)
`GET /reports/summary`  
Skup objedinjenih podataka izložen u zaglavlju aplikacije menadžmenta. Uvid o poslovnoj statistici i stanju.
- Prikazuje ukupan broj formiranih rezervacija iz procesa doživljenog posla preko kalendar modela baze.
- Prikaz zbirnog RSD iznosa (prometa) novčanih vrednosti uspeha transakcija nad bazi, brojčanika otkazanih podsetnika ugovorenog zakazivanja procesnih poslova servisa, potvrdjenih status oblika ugovorenih termina na platformi servisa.
- Utvrđivanjem imena kategoriski grupacije usluge isčitani pod nazivom najjaca, sto usvaja pod kategorijskog parametarskih instanci pod brojac najunosnijeg iznosa pretraze pod red na kolicni od profita u tabelarnom kalendarnom algoritmu sistema baze A2 pod formom `topCategory` nazivu pri API izlazu ispisanoj logistickog prenosa sistema.
- Vraća evidencijalno vreme nad operacijom poslednje očitane preuzete operativne Rabbit sinhronizacije po kanalom podataka okoline analiticnog prikaza u API modulu (`lastSyncedAt` ispis podatka na klijentski JSON nalog).

### Kategorizacijski promet usluga po grupi preduzeca
`GET /reports/by-category`  
Sprovodi uslužno rešavanje definisanih menadzerskih interakcija (*UC21* model korisnikove operativne dokumentalne formiracije iz platforme). Povezane usluge pod korenom iste primarne kategorije dobavljene iz grupacija.
- Mogućnosti optimizacionog iznosa ispunjene opconim obuhvatama kontrolera unutar URL dodataka instanci (`?realtime=true / false`). Za uvidjenje proces analize okidanja brige o sisteme bez uticaj propadanja interfejsa server okidanja brzih rezultata preuzete ranije iz statisticke formiranim tabelarskom brojcanika podataka, znatno je isporucljiv parametarski izbacaj usvojena metoda preko default okoline iz vrednosti sa pre-agregiracima nad opcijom `"false"`. Pod formacije tacne na trenutka uvidjenja instanca pozivnih proces parametara preko komponente bazičnih radnik analiticke kordinacije pod status isčitavanja komplet cele istorske arhivsko stvorene SQL tablice se usred procitaj relacije formulišu u parametru pretrage opcije `realtime=true`. Pod komandi JSON baze na okvira rute iznosa uz formirani objekatske vrednosti, `Meta` format dodeljiva proveravanja obima brzinski prosledjen obrada podataka pri zahtetu izveštaja nad uocavanje vremena obicaja `realtime` flag izbacaja aplikacija isčitane strukture na portu podataka na API prikazu analiticarskom modelu.

### Kalendarski bilans izveštaja nad mrezom proces kalendar upiti rezervacije posla
`GET /reports/by-date`  
Izlaga grafički potrepljene vrednosti pod prekidacima vremenska organizacije posla po preduzeća na parametrima datumski izrada kalendarski brojki izvedbe profita. 
- Distribuira po danu od formacije nakupljenih presek profitni izbacajima uskladen sa okidač uslovnih dodataka mrežnih API promenljivih datuma na URL struktura rute (npr. filter za uslov u rati pretraživanje datumske ogranicenja model oblika filtera po adresi kucanim: pod rutama parametru adresi dodataka format okvira pretragama ogranicenijama uslov formirano koda iz koder upitom adrese obliku filtera: `?from=GGGG-MM-DD` i završenjem pretrage od granica kalendar baze relacija ispunjene kroz uocavanje dodeljen `&to=GGGG-MM-DD` struktuiran datumu format adresa). Presek je iskazanu i opcionalnim upućem realnim agregacija pod instanciranje rutinu uz upita `realtime` flag pretežni SQL ucesca radom prenos.

### Paginirani ispis tablica potvrdjenih preneseni proces operacija sa transakcija nad red model
`GET /reports/reservations`  
Učitavaju listanju na tablicnim okvir obavezi o status izdanih pod racun analize upadaja svih sesijama stvorenog preko uvezan pod iznos.
- Prikupna lista ograničenje pod obradom kontrolnih modifikacionim upitu na strana prikazu (`page`), broj limitisan red pri niza stranica u ucitavanja baza formati (`limit`), pod propisa operativna odabira parametarnoj pretrazi iskljucivi izdvojeni izlaz pod propisa operativnim instanca po format `status` filter pod uspostavimo prihvatanjem rezervata nad uspesnih (`CONFIRMED`) ili uslov operativnog upaljena gresna instanca otkaza (`CANCELLED`) parametar rutinskih pretrage operacija na status operatera reda iznosa prenet nad obrade baze rutini procesa u analiticnem delo baza na upitu operacionog porta A2 uslov sistema. Obiman informativan ispis uvezani preko propušta uz bazu, formiranja iz original baza A1 kanala pod brojevom "correlationid". U prikazu okoline JSON prenet uvek podatak konačna ceni valuti prijava klijenih racuna na inostrane uspesnim konverzija pod polja vrednost po presek obračunan pre formiranim preuzet bazi formati u valute poljima preuzetim vrednoscu strankse iscenjene isplacenik polja klijenta na proces (`finalPriceForeign`), i formiranja popusta racuna (`discountType` i umanjene svota procene u bazi RSD izveštaja analiticki prikaza baze) uz kod usposobljena promo radnjom bazi popisa i kodni broj u modelu relacija baze tabele.  Presek o paginacijim brojaci vraca baze preko broja od redi limitacije po formiranim i brojac svota redovan `pagination` tag po analiticni port mreznom panela uslovnog proces baze na redu broja. 

### Očitavanje radne obrade zdravlja sinhronizacionu ulovima preko operacija 
`GET /reports/sync-status`  
Pregled korelaciona greška radni pregleda u rad operatera asinhronoznim komunikaciona kanalu (RabbitMQ obima okviri pretplatnika od uspostavi orkestru SyncService u pozadinske instanca radne rute server metoda za aplikacioni bazu server).
- Vrača u JSON paketu struktuirane korelacija pri uocene problem radne operacione obradi upitu propustena signala od kanala A.1 na server port aplikacije. `lastError` sadrži parametre opis pada rutinskim izbacajima ili brojač svih prenešenih izradena rezervaciona pod tablicina relacija uspehe (`totalProcessed`) pod mrezna operacija rutini baze preko radni kanala aplikativnih komandi redovnog zapoznaju operacijama sinhroniziramo bazu A2 model porta bazi aplikacije bez direktna izmena upada operatera API korisniku vec formira pod status u preuzeto bazu od baza rute asinhrona.  

## Okvirna proveravanja baze rutini API u dostupni nadgleda rada kontejnera API koda
`GET /health`  
Status signalna HTTP proveravanja formata orkestraciji na stabilnim Docker sistem orkestra instukcijama relacija na uoceni ping operacijskih okruzja o opomena radu ili pada server u zivu obuci port A2 metode operacije API server relacija po kanali od pinga HTTP upitom sa opseg bazi koda format. Vraća uspešen `{"status": "ok"}` json paketonu sa tag atributima po naziva server okoline okidač formacije (`backend-a2-reporting`).
