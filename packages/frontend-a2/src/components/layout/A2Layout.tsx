import { Outlet } from 'react-router-dom';
import { useReportingStore } from '../../store/reportingStore';
import styles from './A2Layout.module.css';

export function A2Layout() {
  const { syncStatus, lastRefreshed } = useReportingStore();

  const formatLastRefresh = () => {
    if (!lastRefreshed) return 'Nikad';
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Upravo sada';
    if (diffMins === 1) return '1 minut pre';
    return `${diffMins} minuta pre`;
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span>✂</span>
          <div className={styles.logoText}>
            <h1>Salon Trač</h1>
            <p>Reporting Portal</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="/" className={styles.navLink}>
            📊 Dashboard
          </a>
          <a href="/kategorije" className={styles.navLink}>
            📈 Po kategorijama
          </a>
          <a href="/po-datumima" className={styles.navLink}>
            📅 Po datumima
          </a>
          <a href="/rezervacije" className={styles.navLink}>
            📝 Rezervacije
          </a>
        </nav>

        <div className={styles.footer}>
          <div className={styles.refreshInfo}>
            <small>Osveženo: {formatLastRefresh()}</small>
          </div>
          {syncStatus?.error && (
            <div className={styles.syncError} title={syncStatus.error}>
              ⚠ Sinhronizacija greška
            </div>
          )}
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
