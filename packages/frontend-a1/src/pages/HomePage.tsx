import { useEffect }       from 'react';
import { Link }            from 'react-router-dom';
import { useSalonStore }   from '../store/salonStore';
import { Spinner }         from '../components/ui/Spinner';
import { ErrorMessage }    from '../components/ui/ErrorMessage';
import styles              from './HomePage.module.css';

export function HomePage() {
  const { salonInfo, categories, isLoading, error, fetchAll } = useSalonStore();

  useEffect(() => {
    if (!salonInfo) fetchAll();
  }, []);

  if (isLoading) {
    return <Spinner size="lg" message="Učitavanje..." fullPage />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchAll} />;
  }

  return (
    <div className={styles.page}>

      {/* ── Hero sekcija ────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>✂ Dobrodošli</div>
          <h1 className={styles.heroTitle}>
            {salonInfo?.naziv ?? 'Salon Trač'}
          </h1>
          <p className={styles.heroSubtitle}>
            {salonInfo?.opis ?? 'Vaš omiljeni salon lepote'}
          </p>
          <div className={styles.heroActions}>
            <Link to="/rezervacija" className={styles.btnPrimary}>
              Rezervišite termin
            </Link>
            <Link to="/usluge" className={styles.btnSecondary}>
              Pogledajte usluge
            </Link>
          </div>
        </div>
        <div className={styles.heroDecor}>💆♀</div>
      </section>

      {/* ── Info kartice ────────────────────────── */}
      {salonInfo && (
        <section className={styles.infoSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>📍</span>
              <div>
                <h3>Lokacija</h3>
                <p>{salonInfo.lokacija}</p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>🕐</span>
              <div>
                <h3>Radno vreme</h3>
                <p>{salonInfo.radnoVremeOd} – {salonInfo.radnoVremeDo}</p>
                <small>Pon – Ned</small>
              </div>
            </div>

            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>📞</span>
              <div>
                <h3>Rezervacije</h3>
                <p>Online putem sajta</p>
                <small>24/7 dostupno</small>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Kategorije — kratki pregled ──────────── */}
      {categories.length > 0 && (
        <section className={styles.categoriesSection}>
          <div className={styles.sectionHeader}>
            <h2>Naše usluge</h2>
            <Link to="/usluge" className={styles.viewAll}>
              Sve usluge →
            </Link>
          </div>

          <div className={styles.categoriesGrid}>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/usluge?kategorijaId=${cat.id}`}
                className={styles.categoryCard}
              >
                <div className={styles.categoryIcon}>
                  {getCategoryIcon(cat.naziv)}
                </div>
                <h3 className={styles.categoryName}>{cat.naziv}</h3>
                <p className={styles.categoryCount}>
                  {cat.services.length} uslug{cat.services.length === 1 ? 'a' : 'e'}
                </p>
                <div className={styles.categoryServices}>
                  {cat.services.slice(0, 3).map((svc) => (
                    <span key={svc.id} className={styles.serviceTag}>
                      {svc.naziv}
                    </span>
                  ))}
                  {cat.services.length > 3 && (
                    <span className={styles.moreTag}>
                      +{cat.services.length - 3} više
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA Banner ──────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaContent}>
          <h2>Rezervišite vaš termin danas</h2>
          <p>Brzo, jednostavno i bez čekanja na telefonu</p>
        </div>
        <Link to="/rezervacija" className={styles.ctaBtn}>
          Rezervišite odmah
        </Link>
      </section>

    </div>
  );
}

// Helper za ikone kategorija
function getCategoryIcon(naziv: string): string {
  const n = naziv.toLowerCase();
  if (n.includes('masaž'))    return '💆';
  if (n.includes('lic'))      return '✨';
  if (n.includes('nokat') || n.includes('manikir') || n.includes('pedikir')) return '💅';
  if (n.includes('depilacij')) return '🌸';
  if (n.includes('frizir') || n.includes('kos')) return '💇';
  return '⭐';
}
