import { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReportingStore } from '../store/reportingStore';
import { Spinner } from '../components/ui/Spinner';
import styles from './CategoryStatsPage.module.css';

export function CategoryStatsPage() {
  const { categoryStats, isLoading, fetchCategoryStats } = useReportingStore();
  const [realtime, setRealtime] = useState(false);
  const [sortBy, setSortBy] = useState<'slots' | 'revenue'>('slots');
  const realtimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchCategoryStats(realtime);
  }, [realtime, fetchCategoryStats]);

  useEffect(() => {
    if (!realtime) {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
      return;
    }

    realtimeIntervalRef.current = setInterval(() => {
      fetchCategoryStats(true);
    }, 15000); // 15s for realtime

    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
    };
  }, [realtime, fetchCategoryStats]);

  if (isLoading && categoryStats.length === 0) {
    return <Spinner size="lg" message="Učitavanje statistike po kategorijama..." fullPage />;
  }

  const sortedStats = [...categoryStats].sort((a, b) => {
    if (sortBy === 'slots') {
      return b.totalSlots - a.totalSlots;
    }
    return b.totalPrice - a.totalPrice;
  });

  const chartData = sortedStats.map((cat) => ({
    name: cat.categoryNaziv,
    slots: cat.totalSlots,
    revenue: cat.totalPrice,
  }));

  const maxSlots = Math.max(...sortedStats.map((c) => c.totalSlots), 1);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Statistika po kategorijama</h1>
        <div className={styles.controls}>
          <div className={styles.sortControl}>
            <label>
              Sortiraj po:
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'slots' | 'revenue')}>
                <option value="slots">Broj termina</option>
                <option value="revenue">Prihod</option>
              </select>
            </label>
          </div>
          <label className={styles.realtimeToggle}>
            <input
              type="checkbox"
              checked={realtime}
              onChange={(e) => setRealtime(e.target.checked)}
            />
            <span>Real-time ({realtime ? '15s' : 'Cache'})</span>
          </label>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className={styles.miniKpiGrid}>
        <div className={styles.miniKpi}>
          <div className={styles.miniKpiLabel}>Ukupne kategorije</div>
          <div className={styles.miniKpiValue}>{categoryStats.length}</div>
        </div>
        <div className={styles.miniKpi}>
          <div className={styles.miniKpiLabel}>Ukupno termina</div>
          <div className={styles.miniKpiValue}>{categoryStats.reduce((sum, c) => sum + c.totalSlots, 0)}</div>
        </div>
        <div className={styles.miniKpi}>
          <div className={styles.miniKpiLabel}>Ukupan prihod</div>
          <div className={styles.miniKpiValue}>{categoryStats.reduce((sum, c) => sum + c.totalPrice, 0).toLocaleString('sr-RS')} RSD</div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartCard}>
        <h3>Termini i prihod po kategoriji</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" label={{ value: 'Termini', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Prihod (RSD)', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="slots" fill="#3b82f6" name="Termini" />
              <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Prihod (RSD)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.emptyChart}>Nema podataka</div>
        )}
      </div>

      {/* Detailed Table */}
      <div className={styles.tableCard}>
        <h3>Detaljni pregled</h3>
        {sortedStats.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Kategorija</th>
                  <th>Broj termina</th>
                  <th>% od ukupno</th>
                  <th>Ukupan prihod</th>
                  <th>Prosječna cijena</th>
                  <th>Broj rezervacija</th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((cat) => {
                  const percentage = ((cat.totalSlots / maxSlots) * 100).toFixed(1);
                  const avgPrice = cat.totalSlots > 0 ? (cat.totalPrice / cat.totalSlots).toFixed(0) : 0;
                  return (
                    <tr key={cat.categoryId}>
                      <td className={styles.categoryName}>{cat.categoryNaziv}</td>
                      <td>{cat.totalSlots}</td>
                      <td>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
                          <span className={styles.progressText}>{percentage}%</span>
                        </div>
                      </td>
                      <td className={styles.revenue}>{cat.totalPrice.toLocaleString('sr-RS')} RSD</td>
                      <td>{avgPrice} RSD</td>
                      <td>{cat.reservationCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyTable}>Nema podataka</p>
        )}
      </div>
    </div>
  );
}
