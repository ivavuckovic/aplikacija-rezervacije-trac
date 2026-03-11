import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSalonStore }         from '../store/salonStore';
import { Spinner }               from '../components/ui/Spinner';
import { ErrorMessage }          from '../components/ui/ErrorMessage';
import type { Service }          from '../types';
import styles                    from './ServicesPage.module.css';

export function ServicesPage() {
  const { categories, isLoading, error, fetchCategories } = useSalonStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch]             = useState('');

  const activeCategoryId = searchParams.get('kategorijaId')
    ? parseInt(searchParams.get('kategorijaId')!, 10)
    : null;

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, []);

  if (isLoading) return <Spinner size="lg" message="Učitavanje usluga..." fullPage />;
  if (error)     return <ErrorMessage message={error} onRetry={fetchCategories} />;

  // Filter po pretrazi
  const filtered = categories
    .map((cat) => ({
      ...cat,
      services: cat.services.filter(
        (s) =>
          s.naziv.toLowerCase().includes(search.toLowerCase()) ||
          (s.opis ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter(
      (cat) =>
        (activeCategoryId === null || cat.id === activeCategoryId) &&
        cat.services.length > 0,
    );

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Naše usluge</h1>
          <p className={styles.subtitle}>
            Odaberite kategoriju i pronađite savršenu uslugu za vas
          </p>
        </div>
        <Link to="/rezervacija" className={styles.reserveBtn}>
          Rezervišite termin
        </Link>
      </div>

      {/* ── Filteri ─────────────────────────────── */}
      <div className={styles.filters}>
        {/* Pretraga */}
        <input
          type="text"
          placeholder="🔍 Pretraži usluge..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        {/* Kategorije tabs */}
        <div className={styles.categoryTabs}>
          <button
            className={`${styles.tab} ${activeCategoryId === null ? styles.tabActive : ''}`}
            onClick={() => setSearchParams({})}
          >
            Sve
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.tab} ${activeCategoryId === cat.id ? styles.tabActive : ''}`}
              onClick={() => setSearchParams({ kategorijaId: String(cat.id) })}
            >
              {cat.naziv}
            </button>
          ))}
        </div>
      </div>

      {/* ── Prikaz kategorija i usluga ───────────── */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <span>🔍</span>
          <p>Nema usluga koje odgovaraju pretrazi</p>
          <button
            onClick={() => { setSearch(''); setSearchParams({}); }}
            className={styles.clearBtn}
          >
            Obriši filtere
          </button>
        </div>
      ) : (
        <div className={styles.categoriesList}>
          {filtered.map((cat) => (
            <section key={cat.id} className={styles.categorySection}>

              {/* Kategorija header */}
              <div className={styles.categoryHeader}>
                <h2 className={styles.categoryName}>{cat.naziv}</h2>
                {cat.opis && (
                  <p className={styles.categoryDesc}>{cat.opis}</p>
                )}
                <span className={styles.categoryCount}>
                  {cat.services.length} {cat.services.length === 1 ? 'usluga' : 'usluge'}
                </span>
              </div>

              {/* Grid usluga */}
              <div className={styles.servicesGrid}>
                {cat.services.map((svc) => (
                  <ServiceCard
                    key={svc.id}
                    service={svc}
                    categoryId={cat.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Service Card komponenta ───────────────────────────
interface ServiceCardProps {
  service:    Service;
  categoryId: number;
}

function ServiceCard({ service, categoryId }: ServiceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.serviceCard}>
      {/* Header */}
      <div className={styles.serviceHeader}>
        <h3 className={styles.serviceName}>{service.naziv}</h3>
        <span className={styles.servicePrice}>
          {service.cenaRsd.toLocaleString('sr-RS')} RSD
        </span>
      </div>

      {/* Meta info */}
      <div className={styles.serviceMeta}>
        <span className={styles.metaItem}>
          ⏱ {service.trajanjeMin} min
        </span>
        <span className={styles.metaItem}>
          👥 do {service.maxKlijenataPoTerminu}{' '}
          {service.maxKlijenataPoTerminu === 1 ? 'klijenta' : 'klijenata'}
        </span>
        <span className={styles.metaItem}>
          🕐 {service.vremePocetkaPrvogTermina} – {service.vremeZavrsetkaPoslednjeg}
        </span>
      </div>

      {/* Opis (expandable) */}
      {service.opis && (
        <div className={styles.serviceDesc}>
          <p className={expanded ? '' : styles.descTruncated}>
            {service.opis}
          </p>
          {service.opis.length > 100 && (
            <button
              className={styles.expandBtn}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Prikaži manje ↑' : 'Prikaži više ↓'}
            </button>
          )}
        </div>
      )}

      {/* CTA */}
      <Link
        to={`/rezervacija?serviceId=${service.id}&categoryId=${categoryId}`}
        className={styles.bookBtn}
      >
        Rezerviši
      </Link>
    </div>
  );
}
