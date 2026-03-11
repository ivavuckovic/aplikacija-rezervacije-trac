import { useSalonStore } from '../../store/salonStore';
import styles            from './Footer.module.css';

export function Footer() {
  const { salonInfo } = useSalonStore();

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.info}>
          <strong>{salonInfo?.naziv ?? 'Salon Trač'}</strong>
          {salonInfo && (
            <span className={styles.location}>📍 {salonInfo.lokacija}</span>
          )}
        </div>

        {salonInfo && (
          <div className={styles.hours}>
            🕐 Radno vrijeme: {salonInfo.radnoVremeOd} – {salonInfo.radnoVremeDo}
          </div>
        )}

        <div className={styles.copy}>
          © {new Date().getFullYear()} Salon Trač. Sva prava zadržana.
        </div>
      </div>
    </footer>
  );
}
