import { useEffect, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useReportingStore } from '../store/reportingStore';
import { Spinner } from '../components/ui/Spinner';
import styles from './DailyStatsPage.module.css';

export function DailyStatsPage() {
  const { dailyStats, isLoading, fetchDailyStats } = useReportingStore();
  const [realtime, setRealtime] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const realtimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchDailyStats(fromDate, toDate, realtime);
  }, [fromDate, toDate, realtime, fetchDailyStats]);

  useEffect(() => {
    if (!realtime) {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
      return;
    }

    realtimeIntervalRef.current = setInterval(() => {
      fetchDailyStats(fromDate, toDate, true);
    }, 15000); // 15s for realtime

    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
    };
  }, [realtime, fromDate, toDate, fetchDailyStats]);

  if (isLoading && dailyStats.length === 0) {
    return <Spinner size="lg" message="Učitavanje dnevne statistike..." fullPage />;
  }

  const avgPrice = dailyStats.length > 0
    ? dailyStats.reduce((sum, d) => sum + d.totalPrice, 0) / dailyStats.length
    : 0;

  const chartData = dailyStats.map((day) => ({
    date: new Date(day.date + 'T00:00:00').toLocaleDateString('sr-RS', { month: 'short', day: 'numeric' }),
    fullDate: day.date,
    slots: day.totalSlots,
    revenue: day.totalPrice,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Statistika po datumima</h1>
        <label className={styles.realtimeToggle}>
          <input
            type="checkbox"
            checked={realtime}
            onChange={(e) => setRealtime(e.target.checked)}
          />
          <span>Real-time ({realtime ? '15s' : 'Cache'})</span>
        </label>
      </div>

      {/* Date Filter */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label>
            Od datuma:
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label>
            Do datuma:
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Mini KPIs */}
      <div className={styles.miniKpiGrid}>
        <div className={styles.miniKpi}>
          <div className={styles.miniKpiLabel}>Dana u periodu</div>
          <div className={styles.miniKpiValue}>{dailyStats.length}</div>
        </div>
        <div className={styles.miniKpi}>
          <div className={styles.miniKpiLabel}>Ukupno termina</div>
          <div className={styles.miniKpiValue}>{dailyStats.reduce((sum, d) => sum + d.totalSlots, 0)}</div>
        </div>
        <div className={styles.miniKpi}>
          <div className={styles.miniKpiLabel}>Ukupan prihod</div>
          <div className={styles.miniKpiValue}>{dailyStats.reduce((sum, d) => sum + d.totalPrice, 0).toLocaleString('sr-RS')} RSD</div>
        </div>
        <div className={styles.miniKpi}>
          <div className={styles.miniKpiLabel}>Prosečna dnevna cena</div>
          <div className={styles.miniKpiValue}>{Math.round(avgPrice).toLocaleString('sr-RS')} RSD</div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartCard}>
        <h3>Trend prihoda i termina po danima</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" label={{ value: 'Prihod (RSD)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Termini', angle: 90, position: 'insideRight' }} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                formatter={(value, name) => {
                  if (name === 'revenue') return [value.toLocaleString('sr-RS'), 'Prihod (RSD)'];
                  return [value, 'Termini'];
                }}
                labelFormatter={(label) => `Datum: ${label}`}
              />
              <Legend />
              <ReferenceLine
                yAxisId="left"
                y={Math.round(avgPrice)}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{ value: 'Prosečna cena', position: 'right', fill: '#f59e0b' }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Prihod (RSD)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="slots"
                stroke="#3b82f6"
                fillOpacity={0.1}
                fill="#3b82f6"
                name="Termini"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.emptyChart}>Nema podataka za odabrani period</div>
        )}
      </div>

      {/* Detailed Table */}
      <div className={styles.tableCard}>
        <h3>Detaljni pregled po danima</h3>
        {dailyStats.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Broj termina</th>
                  <th>Ukupan prihod</th>
                  <th>Prosečna cena</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((day, idx) => {
                  const prev = idx > 0 ? dailyStats[idx - 1].totalPrice : day.totalPrice;
                  const trend = day.totalPrice > prev ? '▲' : day.totalPrice < prev ? '▼' : '→';
                  const trendColor = day.totalPrice > prev ? '#10b981' : day.totalPrice < prev ? '#ef4444' : '#94a3b8';
                  const avgPrice = day.totalSlots > 0 ? (day.totalPrice / day.totalSlots).toFixed(0) : 0;
                  return (
                    <tr key={day.date}>
                      <td className={styles.dateCell}>
                        {new Date(day.date + 'T00:00:00').toLocaleDateString('sr-RS', {
                          weekday: 'short',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </td>
                      <td>{day.totalSlots}</td>
                      <td className={styles.revenue}>{day.totalPrice.toLocaleString('sr-RS')} RSD</td>
                      <td>{avgPrice} RSD</td>
                      <td style={{ color: trendColor, fontWeight: 'bold', fontSize: '1.2rem' }}>{trend}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyTable}>Nema podataka za odabrani period</p>
        )}
      </div>
    </div>
  );
}
