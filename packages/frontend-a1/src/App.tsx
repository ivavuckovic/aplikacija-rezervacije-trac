import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout }                  from './components/layout/Layout';
import { HomePage }                from './pages/HomePage';
import { ServicesPage }            from './pages/ServicesPage';
import { ReservationPage }         from './pages/ReservationPage';
import { ReservationStatusPage }   from './pages/ReservationStatusPage';
import { MyReservationPage }       from './pages/MyReservationPage';
import { AdminPage }               from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Početna stranica */}
        <Route index element={<HomePage />} />

        {/* Usluge po kategorijama */}
        <Route path="usluge" element={<ServicesPage />} />

        {/* Multi-step rezervacija */}
        <Route path="rezervacija" element={<ReservationPage />} />

        {/* Polling status rezervacije */}
        <Route
          path="rezervacija/status/:correlationId"
          element={<ReservationStatusPage />}
        />

        {/* Pregled/izmena/otkazivanje rezervacije */}
        <Route path="moja-rezervacija" element={<MyReservationPage />} />

        {/* Admin Paneli */}
        <Route path="admin" element={<AdminPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
