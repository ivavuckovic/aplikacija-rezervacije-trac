import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { A2Layout } from './components/layout/A2Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CategoryStatsPage } from './pages/CategoryStatsPage';
import { DailyStatsPage } from './pages/DailyStatsPage';
import { ReservationsListPage } from './pages/ReservationsListPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<A2Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/kategorije" element={<CategoryStatsPage />} />
          <Route path="/po-datumima" element={<DailyStatsPage />} />
          <Route path="/rezervacije" element={<ReservationsListPage />} />
          <Route path="/*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
