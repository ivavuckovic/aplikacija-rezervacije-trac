import { useEffect, useState, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReportingStore } from '../store/reportingStore';
import { Spinner } from '../components/ui/Spinner';
import styles from './DashboardPage.module.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DashboardPage() {
  const { summary, categoryStats, syncStatus, isLoading, fetchAll } = useReportingStore();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchAll(false); // Pre-aggregated data by default
  }, [fetchAll]);

  useEffect(() => {
    if (!autoRefresh) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Set initial refresh
    refreshIntervalRef.current = setInterval(() => {
      fetchAll(false);
    }, 30000); // 30s

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchAll]);

  if (isLoading && !summary) {
    return <Spinner size="lg" message="Učitavanje dashboard-a..." fullPage />;
  }

  const chartData = categoryStats.slice(0, 5).map((cat) => ({
    name: cat.categoryNaziv,
    value: cat.totalSlots,
  }));

  const barChartData = categoryStats.slice(0, 10).map((cat) => ({
    name: cat.categoryNaziv.length > 10 ? cat.categoryNaziv.substring(0, 10) + '...' : cat.categoryNaziv,
    slots: cat.totalSlots,
    revenue: cat.totalPrice,
  }));

  const KpiCard = ({ icon, label, value, subtext }: { icon: string; label: string; value: string; subtext?: string }) => (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiContent}>
        <div className={styles.kpiLabel}>{label}</div>
        <div className={styles.kpiValue}>{value}</div>
        {subtext && <div className={styles.kpiSubtext}>{subtext}</div>}
      </div>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <div className={styles.headerControls}>
          <label className={styles.autoRefreshToggle}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-osvežavanje (30s)</span>
          </label>
        </div>
      </div>

      {syncStatus?.error && (
        <div className={styles.syncBar}>
          <span>⚠ Sinhronizacija greška: {syncStatus.error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KpiCard
          icon="📦"
          label="Ukupno rezervacija"
          value={summary?.totalReservations.toLocaleString('sr-RS') || '0'}
        />
        <KpiCard
          icon="💰"
          label="Ukupna prihod"
          value={`${(summary?.totalRevenue || 0).toLocaleString('sr-RS')} RSD`}
        />
        <KpiCard
          icon="⏱"
          label="Ukupno termina"
          value={summary?.totalSlots.toLocaleString('sr-RS') || '0'}
        />
        <KpiCard
          icon="📊"
          label="Prosječna cijena po terminu"
          value={`${(summary?.avgPricePerSlot || 0).toLocaleString('sr-RS')} RSD`}
        />
        <KpiCard
          icon="⭐"
          label="Top kategorija"
          value={summary?.topCategory || 'N/A'}
          subtext={`${summary?.topCategoryCount || 0} rezervacija`}
        />
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Pie Chart */}
        <div className={styles.chartCard}>
          <h3>Termini po kategoriji (Top 5)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.emptyChart}>Nema podataka</div>
          )}
        </div>

        {/* Bar Chart */}
        <div className={styles.chartCard}>
          <h3>Termini i prihod po kategoriji (Top 10)</h3>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
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
      </div>
    </div>
  );
}
