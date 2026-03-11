import { useEffect, useState } from 'react';
import { reportingService } from '../services/reportingService';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import styles from './ReservationsListPage.module.css';

export function ReservationsListPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await reportingService.getReservations(page, limit, status);
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Greška pri učitavanju rezervacija';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [page, status, limit]);

  if (isLoading && !data) {
    return <Spinner size="lg" message="Učitavanje rezervacija..." fullPage />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return styles.statusConfirmed;
      case 'CANCELLED':
        return styles.statusCancelled;
      case 'PENDING':
        return styles.statusPending;
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '✓ Potvrđena';
      case 'CANCELLED':
        return '✕ Otkazana';
      case 'PENDING':
        return '⏱ Na čekanju';
      default:
        return status;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Rezervacije</h1>
        <div className={styles.filterControl}>
          <label>
            Status:
            <select value={status || ''} onChange={(e) => {
              setStatus(e.target.value || undefined);
              setPage(1);
            }}>
              <option value="">Svi</option>
              <option value="CONFIRMED">Potvrđene</option>
              <option value="CANCELLED">Otkazane</option>
              <option value="PENDING">Na čekanju</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <span>❌ {error}</span>
        </div>
      )}

      {data && data.items && data.items.length > 0 ? (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Šifra</th>
                  <th>Ime i prezime</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Početni datum</th>
                  <th>Broj termina</th>
                  <th>Ukupna cijena</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((res: any) => (
                  <tr key={res.id}>
                    <td className={styles.sifraMono}>{res.sifra}</td>
                    <td>{`${res.ime} ${res.prezime}`}</td>
                    <td className={styles.emailCell}>{res.email}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusColor(res.status)}`}>
                        {getStatusLabel(res.status)}
                      </span>
                    </td>
                    <td>
                      {new Date(res.createdAt).toLocaleDateString('sr-RS')}
                    </td>
                    <td>{res.slotsCount}</td>
                    <td className={styles.price}>{res.totalPrice.toLocaleString('sr-RS')} RSD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={styles.paginationBtn}
              >
                ← Prethodno
              </button>
              <span className={styles.pageInfo}>
                Stranica {page} od {data.pages} ({data.total} rezultata)
              </span>
              <button
                onClick={() => setPage(Math.min(data.pages, page + 1))}
                disabled={page === data.pages}
                className={styles.paginationBtn}
              >
                Sljedeće →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>📋 Nema pronađenih rezervacija</p>
        </div>
      )}
    </div>
  );
}
