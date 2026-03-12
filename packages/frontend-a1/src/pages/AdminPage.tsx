import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';
import type { ServiceCategory, Service, AllowedCurrency } from '../types';
import styles from './AdminPage.module.css';

type Tab = 'KATEGORIJE' | 'USLUGE' | 'VALUTE' | 'POPUST';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('KATEGORIJE');

  // State
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currencies, setCurrencies] = useState<AllowedCurrency[]>([]);

  // Forms
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [svcCategory, setSvcCategory] = useState<number>(0);
  const [svcName, setSvcName] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcDuration, setSvcDuration] = useState(15);
  const [svcMaxClients, setSvcMaxClients] = useState(1);
  const [svcStartTime, setSvcStartTime] = useState('09:00');
  const [svcEndTime, setSvcEndTime] = useState('20:00');
  const [svcPrice, setSvcPrice] = useState(0);

  const [currCode, setCurrCode] = useState('');
  const [currName, setCurrName] = useState('');

  const [discPercent, setDiscPercent] = useState(10);
  const [discUntil, setDiscUntil] = useState('');

  // Fetch data
  const loadData = async () => {
    try {
      const [cats, svcs, currs, disc] = await Promise.all([
        adminService.getCategories(),
        adminService.getServices(),
        adminService.getCurrencies(),
        adminService.getDiscountConfig(),
      ]);
      setCategories(cats);
      setServices(svcs);
      setCurrencies(currs);

      if (disc) {
        setDiscPercent(Number(disc.discountPercentage));
        setDiscUntil(disc.validUntil.split('T')[0]);
      }
    } catch (err: any) {
      toast.error('Greska pri ucitavanju: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createCategory({ naziv: catName, opis: catDesc });
      toast.success('Kategorija dodata');
      setCatName('');
      setCatDesc('');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await adminService.deleteCategory(id);
      toast.success('Kategorija obrisana');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createService({
        categoryId: svcCategory,
        naziv: svcName,
        opis: svcDesc,
        trajanjeMin: svcDuration,
        maxKlijenataPoTerminu: svcMaxClients,
        vremePocetkaPrvogTermina: svcStartTime,
        vremeZavrsetkaPoslednjeg: svcEndTime,
        cenaRsd: svcPrice,
      });
      toast.success('Usluga dodata');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteService = async (id: number) => {
    try {
      await adminService.deleteService(id);
      toast.success('Usluga obrisana');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createCurrency({ code: currCode.toUpperCase(), naziv: currName });
      toast.success('Valuta sačuvana');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggleCurrency = async (code: string, currentStatus: boolean) => {
    try {
      await adminService.toggleCurrency(code, !currentStatus);
      toast.success(`Valuta ${!currentStatus ? 'aktivirana' : 'deaktivirana'}`);
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.updateDiscountConfig({ discountPercentage: discPercent, validUntil: discUntil });
      toast.success('Popust azuriran');
      loadData();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Panel</h1>
        <p className={styles.subtitle}>Upravljajte uslugama, valutama i sistemskom konfiguracijom</p>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'KATEGORIJE' ? styles.activeTab : ''}`} onClick={() => setActiveTab('KATEGORIJE')}>Kategorije</button>
        <button className={`${styles.tab} ${activeTab === 'USLUGE' ? styles.activeTab : ''}`} onClick={() => setActiveTab('USLUGE')}>Usluge</button>
        <button className={`${styles.tab} ${activeTab === 'VALUTE' ? styles.activeTab : ''}`} onClick={() => setActiveTab('VALUTE')}>Valute</button>
        <button className={`${styles.tab} ${activeTab === 'POPUST' ? styles.activeTab : ''}`} onClick={() => setActiveTab('POPUST')}>Konfiguracija popusta</button>
      </div>

      <div className={styles.content}>
        
        {/* TAB Kategorije */}
        {activeTab === 'KATEGORIJE' && (
          <div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr><th>ID</th><th>Naziv</th><th>Opis</th><th>Akcije</th></tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.naziv}</td>
                      <td>{c.opis}</td>
                      <td>
                         <button className={styles.actionBtn} onClick={() => handleDeleteCategory(c.id)}>Obrisi</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <form className={styles.form} onSubmit={handleAddCategory}>
              <h3>Dodaj novu kategoriju</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Naziv</label>
                  <input className={styles.input} required value={catName} onChange={e => setCatName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Opis</label>
                  <input className={styles.input} value={catDesc} onChange={e => setCatDesc(e.target.value)} />
                </div>
              </div>
              <button className={styles.btnPrimary} type="submit">Sačuvaj kategoriju</button>
            </form>
          </div>
        )}

        {/* TAB Usluge */}
        {activeTab === 'USLUGE' && (
          <div>
             <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Naziv</th><th>Cena (RSD)</th><th>Trajanje (min)</th><th>Max. Kl.</th><th>Akcije</th></tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s.id}>
                      <td>{s.naziv}</td>
                      <td>{Number(s.cenaRsd).toLocaleString('sr-RS')}</td>
                      <td>{s.trajanjeMin}</td>
                      <td>{s.maxKlijenataPoTerminu}</td>
                      <td>
                         <button className={styles.actionBtn} onClick={() => handleDeleteService(s.id)}>Obrisi</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form className={styles.form} onSubmit={handleAddService}>
              <h3>Dodaj novu uslugu</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Kategorija</label>
                  <select className={styles.input} required value={svcCategory} onChange={e => setSvcCategory(Number(e.target.value))}>
                    <option value={0}>-- Odaberi --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.naziv}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Naziv</label>
                  <input className={styles.input} required value={svcName} onChange={e => setSvcName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cena (RSD)</label>
                  <input className={styles.input} type="number" required value={svcPrice} onChange={e => setSvcPrice(Number(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Trajanje (min)</label>
                  <input className={styles.input} type="number" required value={svcDuration} onChange={e => setSvcDuration(Number(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Max klijenata po terminu</label>
                  <input className={styles.input} type="number" required value={svcMaxClients} onChange={e => setSvcMaxClients(Number(e.target.value))} />
                </div>
                 <div className={styles.formGroup}>
                  <label className={styles.label}>Radno vreme od (HH:MM)</label>
                  <input className={styles.input} required value={svcStartTime} onChange={e => setSvcStartTime(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Radno vreme do (HH:MM)</label>
                  <input className={styles.input} required value={svcEndTime} onChange={e => setSvcEndTime(e.target.value)} />
                </div>
                 <div className={styles.formGroup}>
                  <label className={styles.label}>Opis</label>
                  <input className={styles.input} value={svcDesc} onChange={e => setSvcDesc(e.target.value)} />
                </div>
              </div>
              <button className={styles.btnPrimary} type="submit" disabled={!svcCategory}>Sačuvaj uslugu</button>
            </form>
          </div>
        )}

        {/* TAB Valute */}
        {activeTab === 'VALUTE' && (
           <div>
             <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Kod</th><th>Naziv</th><th>Status</th><th>Akcije</th></tr>
                </thead>
                <tbody>
                  {currencies.map(c => (
                    <tr key={c.id}>
                      <td>{c.code}</td>
                      <td>{c.naziv}</td>
                      <td>{c.isActive ? 'Aktivna' : 'Neaktivna'}</td>
                      <td>
                         <button className={styles.actionBtn} onClick={() => handleToggleCurrency(c.code, c.isActive)}>
                           {c.isActive ? 'Deaktiviraj' : 'Aktiviraj'}
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
             <form className={styles.form} onSubmit={handleAddCurrency}>
              <h3>Dodaj novu valutu</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Kod (Npr. JPY)</label>
                  <input className={styles.input} maxLength={3} required value={currCode} onChange={e => setCurrCode(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Naziv</label>
                  <input className={styles.input} required value={currName} onChange={e => setCurrName(e.target.value)} />
                </div>
              </div>
              <button className={styles.btnPrimary} type="submit">Sačuvaj valutu</button>
            </form>
          </div>
        )}

        {/* TAB Popust */}
        {activeTab === 'POPUST' && (
           <form className={styles.form} onSubmit={handleUpdateDiscount}>
              <h3>Konfiguracija sistemskog popusta</h3>
              <p style={{ marginBottom: '1rem', color: '#666' }}>Postavite procenat popusta i do kada ce vaziti. Isteklom popustu se automatski ignorise primena.</p>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Procenat popusta (%)</label>
                  <input className={styles.input} type="number" required value={discPercent} onChange={e => setDiscPercent(Number(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Datum isteka</label>
                  <input className={styles.input} type="date" required value={discUntil} onChange={e => setDiscUntil(e.target.value)} />
                </div>
              </div>
              <button className={styles.btnPrimary} type="submit" style={{ maxWidth: '200px', marginTop: '1rem' }}>Ažuriraj popust</button>
            </form>
        )}

      </div>
    </div>
  );
}
