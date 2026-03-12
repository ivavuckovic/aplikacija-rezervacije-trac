import { useState }              from 'react';
import { useForm }               from 'react-hook-form';
import { zodResolver }           from '@hookform/resolvers/zod';
import { z }                     from 'zod';
import toast                     from 'react-hot-toast';
import { reservationService }    from '../services/reservationService';
import { servicesService }       from '../services/servicesService';
import { useSalonStore }         from '../store/salonStore';
import { Badge }                 from '../components/ui/Badge';
import type {
  ReservationDetail,
  TimeSlot,
}                                from '../types';
import styles                    from './MyReservationPage.module.css';

// ── Validation schemas ────────────────────────────────
const AuthSchema = z.object({
  sifra: z.string().min(1, 'Šifra je obavezna'),
  email: z.string().email('Unesite ispravnu email adresu'),
});

type AuthForm = z.infer<typeof AuthSchema>;

// ── Helper ─────────────────────────────────────────────
function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('sr-RS', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function MyReservationPage() {
  // ── State ─────────────────────────────────────────
  const { categories } = useSalonStore();

  const [reservation,    setReservation]    = useState<ReservationDetail | null>(null);
  const [isLoading,      setIsLoading]      = useState(false);
  const [authCredentials, setAuthCredentials] = useState<AuthForm | null>(null);

  // Dodavanje usluge
  const [addMode,       setAddMode]       = useState(false);
  const [addServiceId,  setAddServiceId]  = useState<number | null>(null);
  const [addDate,       setAddDate]       = useState('');
  const [addSlots,      setAddSlots]      = useState<TimeSlot[]>([]);
  const [addSlotPick,   setAddSlotPick]   = useState('');
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [isAdding,      setIsAdding]      = useState(false);

  // Uklanjanje usluge
  const [removingKey,   setRemovingKey]   = useState<string | null>(null);

  // Otkazivanje
  const [cancelMode,    setCancelMode]    = useState(false);
  const [isCancelling,  setIsCancelling]  = useState(false);

  // ── Auth forma ────────────────────────────────────
  const { register, handleSubmit, formState: { errors } } =
    useForm<AuthForm>({ resolver: zodResolver(AuthSchema) });

  const onAuth = async (data: AuthForm) => {
    setIsLoading(true);
    try {
      const res = await reservationService.getByCredentials(
        data.sifra.trim().toUpperCase(),
        data.email.trim().toLowerCase(),
      );
      setReservation(res);
      setAuthCredentials(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Greška pri autentifikaciji');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Dodavanje usluge ──────────────────────────────
  const handleLoadSlots = async (serviceId: number, date: string) => {
    setLoadingSlots(true);
    try {
      const slots = await servicesService.getAvailableSlots(serviceId, date);
      setAddSlots(slots);
    } catch {
      toast.error('Greška pri učitavanju termina');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleAddService = async () => {
    if (!addServiceId || !addSlotPick || !authCredentials) return;
    setIsAdding(true);
    try {
      const result = await reservationService.addService(
        authCredentials.sifra.toUpperCase(),
        authCredentials.email.toLowerCase(),
        addServiceId,
        addSlotPick,
      );
      toast.success(result.message);
      // Refresh
      const updated = await reservationService.getByCredentials(
        authCredentials.sifra.toUpperCase(),
        authCredentials.email.toLowerCase(),
      );
      setReservation(updated);
      setAddMode(false);
      setAddServiceId(null);
      setAddDate('');
      setAddSlots([]);
      setAddSlotPick('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Greška pri dodavanju usluge');
    } finally {
      setIsAdding(false);
    }
  };

  // ── Uklanjanje usluge ────────────────────────────
  const handleRemoveService = async (serviceId: number, slotDatetime: string) => {
    if (!authCredentials) return;
    const key = `${serviceId}-${slotDatetime}`;
    setRemovingKey(key);
    try {
      const result = await reservationService.removeService(
        authCredentials.sifra.toUpperCase(),
        authCredentials.email.toLowerCase(),
        serviceId,
        slotDatetime,
      );
      toast.success(result.message);
      const updated = await reservationService.getByCredentials(
        authCredentials.sifra.toUpperCase(),
        authCredentials.email.toLowerCase(),
      );
      setReservation(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Greška pri uklanjanju usluge');
    } finally {
      setRemovingKey(null);
    }
  };

  // ── Otkazivanje ───────────────────────────────────
  const handleCancel = async () => {
    if (!authCredentials) return;
    setIsCancelling(true);
    try {
      await reservationService.cancel(
        authCredentials.sifra.toUpperCase(),
        authCredentials.email.toLowerCase(),
      );
      toast.success('Rezervacija je uspešno otkazana');
      const updated = await reservationService.getByCredentials(
        authCredentials.sifra.toUpperCase(),
        authCredentials.email.toLowerCase(),
      );
      setReservation(updated);
      setCancelMode(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Greška pri otkazivanju');
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancelled  = reservation?.status === 'CANCELLED';
  const isConfirmed  = reservation?.status === 'CONFIRMED';

  // ── AUTH forma (ako nema rezervacije) ─────────────
  if (!reservation) {
    return (
      <div className={styles.page}>
        <div className={styles.authCard}>
          <div className={styles.authIcon}>🔐</div>
          <h1 className={styles.authTitle}>Pristup rezervaciji</h1>
          <p className={styles.authDesc}>
            Unesite šifru i email adresu koje ste dobili pri rezervaciji.
          </p>

          <form onSubmit={handleSubmit(onAuth)} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Šifra rezervacije</label>
              <input
                {...register('sifra')}
                className={`${styles.input} ${errors.sifra ? styles.inputError : ''}`}
                placeholder="npr. A3F9C8D1..."
                autoComplete="off"
              />
              {errors.sifra && (
                <span className={styles.errorMsg}>{errors.sifra.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email adresa</label>
              <input
                {...register('email')}
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="marija@example.com"
              />
              {errors.email && (
                <span className={styles.errorMsg}>{errors.email.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.authBtn}
            >
              {isLoading ? (
                <><span className={styles.btnSpinner} /> Provera...</>
              ) : (
                'Pristupi rezervaciji'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── DETALJI REZERVACIJE ───────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.resHeader}>
        <div>
          <h1 className={styles.resTitle}>Vaša rezervacija</h1>
          <p className={styles.resSubtitle}>
            Kreirana: {formatDateTime(reservation.createdAt)}
          </p>
        </div>
        <div className={styles.resStatus}>
          <Badge
            label={isCancelled ? 'Otkazana' : isConfirmed ? 'Potvrđena' : reservation.status}
            variant={isCancelled ? 'error' : isConfirmed ? 'success' : 'warning'}
          />
        </div>
      </div>

      <div className={styles.resLayout}>

        {/* ── Lijevo: informacije ────────────────── */}
        <div className={styles.resInfo}>

          {/* Lični podaci */}
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>👤 Lični podaci</h3>
            <InfoRow label="Ime i prezime" value={`${reservation.ime} ${reservation.prezime}`} />
            <InfoRow label="Email"         value={reservation.email} />
            <InfoRow label="Adresa"        value={`${reservation.adresa}, ${reservation.postanskiBroj} ${reservation.mesto}, ${reservation.drzava}`} />
          </div>

          {/* Šifra i promo-kod */}
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>🔑 Pristupni podaci</h3>
            <InfoRow label="Šifra" value={reservation.sifra} mono />
            {reservation.promoCode && (
              <InfoRow label="Promo-kod" value={reservation.promoCode} mono />
            )}
          </div>

          {/* Cijena */}
          <div className={styles.infoCard}>
            <h3 className={styles.cardTitle}>💶 Cena</h3>
            <InfoRow
              label="Osnovna cena"
              value={`${reservation.basePriceRsd.toLocaleString('sr-RS')} RSD`}
            />
            {reservation.discountAmountRsd > 0 && (
              <InfoRow
                label="Popust"
                value={`– ${reservation.discountAmountRsd.toLocaleString('sr-RS')} RSD`}
                green
              />
            )}
            <InfoRow
              label={`Ukupno (${reservation.currency})`}
              value={
                reservation.currency === 'RSD'
                  ? `${reservation.finalPriceRsd.toLocaleString('sr-RS')} RSD`
                  : `${reservation.finalPriceForeign.toFixed(2)} ${reservation.currency}`
              }
              bold
            />
            {reservation.promoCodeApplied && (
              <InfoRow label="Promo-kod" value={reservation.promoCodeApplied} />
            )}
          </div>
        </div>

        {/* ── Desno: usluge + akcije ─────────────── */}
        <div className={styles.resActions}>

          {/* Lista usluga */}
          <div className={styles.servicesCard}>
            <div className={styles.servicesCardHeader}>
              <h3 className={styles.cardTitle}>💆 Rezervisane usluge</h3>
              {isConfirmed && (
                <button
                  className={styles.addServiceToggle}
                  onClick={() => setAddMode((p) => !p)}
                >
                  {addMode ? '✕ Zatvori' : '+ Dodaj uslugu'}
                </button>
              )}
            </div>

            {/* Lista */}
            {reservation.services.map((s) => {
              const key         = `${s.serviceId}-${s.slotDatetime}`;
              const isRemoving  = removingKey === key;
              const canRemove   = isConfirmed && reservation.services.length > 1;

              return (
                <div key={key} className={styles.serviceRow}>
                  <div className={styles.serviceRowInfo}>
                    <span className={styles.serviceRowName}>{s.serviceNaziv}</span>
                    <span className={styles.serviceRowCat}>{s.categoryNaziv}</span>
                    <span className={styles.serviceRowTime}>
                      📅 {formatDateTime(s.slotDatetime)}
                    </span>
                    <span className={styles.serviceRowPrice}>
                      {s.priceSnapshotRsd.toLocaleString('sr-RS')} RSD
                    </span>
                  </div>

                  {canRemove && (
                    <button
                      className={styles.removeServiceBtn}
                      onClick={() => handleRemoveService(s.serviceId, s.slotDatetime)}
                      disabled={!!removingKey}
                      title="Ukloni uslugu"
                    >
                      {isRemoving ? <span className={styles.miniSpinner} /> : '✕'}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Forma za dodavanje usluge */}
            {addMode && isConfirmed && (
              <div className={styles.addServiceForm}>
                <h4 className={styles.addServiceTitle}>Dodaj novu uslugu</h4>

                {/* Odabir usluge */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Usluga</label>
                  <select
                    className={styles.input}
                    value={addServiceId ?? ''}
                    onChange={(e) => {
                      setAddServiceId(Number(e.target.value));
                      setAddDate('');
                      setAddSlots([]);
                      setAddSlotPick('');
                    }}
                  >
                    <option value="">— Odaberite uslugu —</option>
                    {categories.map((cat) => (
                      <optgroup key={cat.id} label={cat.naziv}>
                        {cat.services.map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.naziv} ({svc.cenaRsd.toLocaleString('sr-RS')} RSD)
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Datum */}
                {addServiceId && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Datum</label>
                    <input
                      type="date"
                      min={todayStr()}
                      value={addDate}
                      onChange={(e) => {
                        setAddDate(e.target.value);
                        setAddSlotPick('');
                        handleLoadSlots(addServiceId, e.target.value);
                      }}
                      className={styles.input}
                    />
                  </div>
                )}

                {/* Slobodni termini */}
                {addDate && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Termin</label>
                    {loadingSlots ? (
                      <p className={styles.loadingSlots}>Učitavanje termina...</p>
                    ) : addSlots.length === 0 ? (
                      <p className={styles.noSlots}>Nema slobodnih termina</p>
                    ) : (
                      <div className={styles.addSlotsGrid}>
                        {addSlots.filter((s) => !s.isFull).map((slot) => (
                          <button
                            key={slot.datetimeStr}
                            type="button"
                            className={`${styles.addSlotBtn} ${
                              addSlotPick === slot.datetimeStr ? styles.addSlotSelected : ''
                            }`}
                            onClick={() => setAddSlotPick(slot.datetimeStr)}
                          >
                            {new Date(slot.datetimeStr).toLocaleTimeString('sr-RS', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.addServiceActions}>
                  <button
                    onClick={handleAddService}
                    disabled={!addSlotPick || isAdding}
                    className={styles.btnPrimary}
                  >
                    {isAdding ? 'Dodavanje...' : 'Dodaj uslugu'}
                  </button>
                  <button
                    onClick={() => { setAddMode(false); setAddServiceId(null); }}
                    className={styles.btnSecondary}
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Otkazivanje rezervacije */}
          {isConfirmed && (
            <div className={styles.dangerCard}>
              {!cancelMode ? (
                <>
                  <h3 className={styles.dangerTitle}>⚠ Otkazivanje rezervacije</h3>
                  <p className={styles.dangerDesc}>
                    Otkazana rezervacija se ne može ponovo aktivirati.
                    Vaš promo-kod postaje nevažeći.
                  </p>
                  <button
                    onClick={() => setCancelMode(true)}
                    className={styles.btnDanger}
                  >
                    Otkaži rezervaciju
                  </button>
                </>
              ) : (
                <div className={styles.confirmCancel}>
                  <h4>Jeste li sigurni?</h4>
                  <p>Ova akcija je nepovratna.</p>
                  <div className={styles.confirmActions}>
                    <button
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className={styles.btnDanger}
                    >
                      {isCancelling ? 'Otkazivanje...' : 'Da, otkaži'}
                    </button>
                    <button
                      onClick={() => setCancelMode(false)}
                      className={styles.btnSecondary}
                    >
                      Zadrži rezervaciju
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Otkazana poruka */}
          {isCancelled && (
            <div className={styles.cancelledCard}>
              <span>❌</span>
              <div>
                <strong>Rezervacija je otkazana</strong>
                <p>Promo-kod više nije aktivan. Rezervacija ostaje u istoriji.</p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={() => { setReservation(null); setAuthCredentials(null); }}
            className={styles.logoutBtn}
          >
            Pretraži drugu rezervaciju
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label, value, mono, bold, green,
}: {
  label: string; value: string;
  mono?: boolean; bold?: boolean; green?: boolean;
}) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={`
        ${styles.infoValue}
        ${mono  ? styles.infoMono  : ''}
        ${bold  ? styles.infoBold  : ''}
        ${green ? styles.infoGreen : ''}
      `}>
        {value}
      </span>
    </div>
  );
}
