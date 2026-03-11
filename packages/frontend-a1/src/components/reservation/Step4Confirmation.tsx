import { useState, useEffect, useRef } from 'react';
import { useNavigate }                 from 'react-router-dom';
import toast                           from 'react-hot-toast';
import { useReservationStore }         from '../../store/reservationStore';
import { useSalonStore }               from '../../store/salonStore';
import { reservationService }          from '../../services/reservationService';
import type { ReservationStatus }      from '../../types';
import styles                          from './Steps.module.css';

interface Props {
  onBack: () => void;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS        = 30; // 60 sekundi max

export function Step4Confirmation({ onBack }: Props) {
  const navigate  = useNavigate();
  const {
    personalData, selections, currency, promoCode, priceBreakdown,
    correlationId, confirmed,
    setCorrelationId, setConfirmed, resetForm,
  } = useReservationStore();
  const { categories } = useSalonStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling,    setIsPolling]    = useState(false);
  const [pollCount,    setPollCount]    = useState(0);
  const [copied,       setCopied]       = useState<'sifra' | 'promo' | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ako je već confirmed (refresh), prikaži rezultat odmah
  useEffect(() => {
    if (confirmed?.status === 'CONFIRMED') {
      stopPolling();
    }
  }, [confirmed]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsPolling(false);
  };

  // Polling status rezervacije
  const startPolling = (corrId: string) => {
    setIsPolling(true);
    setPollCount(0);

    pollRef.current = setInterval(async () => {
      setPollCount((c) => {
        if (c >= MAX_POLLS) {
          stopPolling();
          toast.error('Obrada rezervacije traje duže od očekivanog. Pokušajte provjeriti status.');
          return c;
        }
        return c + 1;
      });

      try {
        const status = await reservationService.getStatus(corrId);

        if (status.status === 'CONFIRMED') {
          setConfirmed(status);
          stopPolling();
          toast.success('🎉 Rezervacija potvrđena!');
        } else if (status.status === 'FAILED') {
          setConfirmed(status);
          stopPolling();
          toast.error(`Rezervacija nije uspjela: ${status.message ?? 'Nepoznata greška'}`);
        }
        // PENDING → nastavi polling
      } catch {
        // Ignoriši grešku tokom pollinga
      }
    }, POLL_INTERVAL_MS);
  };

  const handleSubmit = async () => {
    if (isSubmitting || !priceBreakdown) return;

    setIsSubmitting(true);
    try {
      const result = await reservationService.create(
        personalData as any,
        selections,
        currency,
        promoCode || undefined,
      );

      setCorrelationId(result.correlationId);
      toast.success('Rezervacija primljena — obrada u toku...');
      startPolling(result.correlationId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Greška pri slanju rezervacije';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'sifra' | 'promo') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast.success('Kopirano!');
    } catch {
      toast.error('Kopiranje nije uspjelo');
    }
  };

  const handleNewReservation = () => {
    resetForm();
    navigate('/rezervacija');
  };

  // ── Ako je potvrđeno — prikaži success screen ────
  if (confirmed?.status === 'CONFIRMED') {
    return (
      <div className={styles.successScreen}>
        <div className={styles.successIcon}>🎉</div>
        <h2 className={styles.successTitle}>Rezervacija potvrđena!</h2>
        <p className={styles.successDesc}>
          Vaša rezervacija je uspješno kreirana. Sačuvajte šifru za kasniji pristup.
        </p>

        {/* Šifra */}
        <div className={styles.codeBox}>
          <div className={styles.codeHeader}>
            <span>🔑 Vaša šifra za pristup</span>
            <button
              onClick={() => copyToClipboard(confirmed.sifra!, 'sifra')}
              className={styles.copyBtn}
            >
              {copied === 'sifra' ? '✓ Kopirano' : '📋 Kopiraj'}
            </button>
          </div>
          <div className={styles.codeValue}>{confirmed.sifra}</div>
          <p className={styles.codeHint}>
            Koristite šifru i email za pristup, izmjenu ili otkazivanje rezervacije.
          </p>
        </div>

        {/* Promo-kod */}
        {confirmed.promoCode && (
          <div className={`${styles.codeBox} ${styles.promoBox}`}>
            <div className={styles.codeHeader}>
              <span>🎁 Vaš promo-kod za sljedeću rezervaciju</span>
              <button
                onClick={() => copyToClipboard(confirmed.promoCode!, 'promo')}
                className={styles.copyBtn}
              >
                {copied === 'promo' ? '✓ Kopirano' : '📋 Kopiraj'}
              </button>
            </div>
            <div className={styles.codeValue}>{confirmed.promoCode}</div>
            <p className={styles.codeHint}>
              Podijelite promo-kod — neko drugi dobija 5% popusta, a vi ostavljate trag!
            </p>
          </div>
        )}

        {/* Cijena */}
        {confirmed.priceBreakdown && (
          <div className={styles.successPrice}>
            <span>Ukupno plaćanje:</span>
            <strong>
              {currency === 'RSD'
                ? `${confirmed.priceBreakdown.finalPriceRsd.toLocaleString('sr-RS')} RSD`
                : `${confirmed.priceBreakdown.finalPriceForeign.toFixed(2)} ${confirmed.priceBreakdown.currency}`
              }
            </strong>
          </div>
        )}

        {/* Odabrane usluge */}
        {confirmed.services && confirmed.services.length > 0 && (
          <div className={styles.successServices}>
            <h4>Rezervisane usluge:</h4>
            {confirmed.services.map((s, i) => (
              <div key={i} className={styles.successServiceRow}>
                <span>{s.serviceNaziv}</span>
                <span>
                  {new Date(s.slotDatetime).toLocaleString('sr-RS', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.successActions}>
          <button onClick={handleNewReservation} className={styles.btnNext}>
            Nova rezervacija
          </button>
          <button
            onClick={() => navigate('/moja-rezervacija')}
            className={styles.btnBack}
          >
            Pregled rezervacije
          </button>
        </div>
      </div>
    );
  }

  // ── FAILED screen ─────────────────────────────────
  if (confirmed?.status === 'FAILED') {
    return (
      <div className={styles.failedScreen}>
        <div className={styles.failedIcon}>❌</div>
        <h2>Rezervacija nije uspjela</h2>
        <p className={styles.failedMsg}>
          {confirmed.message ?? 'Nažalost, rezervacija nije mogla biti obrađena.'}
        </p>
        <div className={styles.formActions}>
          <button onClick={onBack} className={styles.btnBack}>← Nazad</button>
          <button onClick={() => { setConfirmed(null as any); handleSubmit(); }} className={styles.btnNext}>
            Pokušaj ponovo
          </button>
        </div>
      </div>
    );
  }

  // ── Polling screen ────────────────────────────────
  if (isPolling || correlationId) {
    return (
      <div className={styles.pollingScreen}>
        <div className={styles.pollingSpinner} />
        <h3>Rezervacija se obrađuje...</h3>
        <p className={styles.pollingDesc}>
          Molimo sačekajte dok sistem provjeri dostupnost termina i potvrdi rezervaciju.
        </p>
        <div className={styles.pollingProgress}>
          <div
            className={styles.pollingBar}
            style={{ width: `${Math.min((pollCount / MAX_POLLS) * 100, 95)}%` }}
          />
        </div>
        <p className={styles.pollingHint}>Provjera {pollCount + 1} / {MAX_POLLS}</p>
      </div>
    );
  }

  // ── Summary pre slanja ────────────────────────────
  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Pregled i potvrda</h2>
        <p className={styles.stepDesc}>
          Provjerite podatke prije potvrde rezervacije.
        </p>
      </div>

      {/* Lični podaci */}
      <div className={styles.summaryCard}>
        <h3 className={styles.summaryCardTitle}>👤 Vaši podaci</h3>
        <div className={styles.summaryGrid}>
          <SummaryRow label="Ime i prezime" value={`${personalData.ime} ${personalData.prezime}`} />
          <SummaryRow label="Email"         value={personalData.email!} />
          <SummaryRow label="Adresa"        value={`${personalData.adresa}, ${personalData.postanskiBroj} ${personalData.mesto}, ${personalData.drzava}`} />
        </div>
      </div>

      {/* Odabrane usluge */}
      <div className={styles.summaryCard}>
        <h3 className={styles.summaryCardTitle}>💆 Odabrane usluge</h3>
        {selections.map((sel) => {
          const svc = categories.flatMap((c) => c.services).find((s) => s.id === sel.serviceId);
          return (
            <div key={`${sel.serviceId}-${sel.slotDatetime}`} className={styles.summaryServiceRow}>
              <span>{svc?.naziv ?? `Usluga #${sel.serviceId}`}</span>
              <span className={styles.summarySlot}>
                {new Date(sel.slotDatetime).toLocaleString('sr-RS', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cijena */}
      {priceBreakdown && (
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryCardTitle}>💶 Cijena</h3>
          <div className={styles.summaryGrid}>
            <SummaryRow label="Osnovna cijena" value={`${priceBreakdown.basePriceRsd.toLocaleString('sr-RS')} RSD`} />
            {priceBreakdown.discountType !== 'NONE' && (
              <SummaryRow
                label="Popust"
                value={`– ${priceBreakdown.discountAmountRsd.toLocaleString('sr-RS')} RSD`}
                highlight
              />
            )}
            <SummaryRow label="Ukupno (RSD)"   value={`${priceBreakdown.finalPriceRsd.toLocaleString('sr-RS')} RSD`} bold />
            {currency !== 'RSD' && (
              <SummaryRow
                label={`Ukupno (${currency})`}
                value={`${priceBreakdown.finalPriceForeign.toFixed(2)} ${currency}`}
                bold
              />
            )}
          </div>
        </div>
      )}

      <div className={styles.formActions}>
        <button onClick={onBack} className={styles.btnBack} disabled={isSubmitting}>
          ← Nazad
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={styles.btnConfirm}
        >
          {isSubmitting ? 'Slanje...' : '✓ Potvrdi rezervaciju'}
        </button>
      </div>
    </div>
  );
}

function SummaryRow({
  label, value, bold, highlight,
}: {
  label: string; value: string; bold?: boolean; highlight?: boolean;
}) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span
        className={`${styles.summaryValue}
          ${bold      ? styles.summaryBold : ''}
          ${highlight ? styles.summaryHighlight : ''}
        `}
      >
        {value}
      </span>
    </div>
  );
}
