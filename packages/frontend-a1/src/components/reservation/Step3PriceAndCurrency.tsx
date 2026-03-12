import { useState, useEffect, useCallback } from 'react';
import toast                                from 'react-hot-toast';
import { useReservationStore }              from '../../store/reservationStore';
import { useSalonStore }                    from '../../store/salonStore';
import { reservationService }              from '../../services/reservationService';
import type { AllowedCurrency } from '../../types';
import styles                              from './Steps.module.css';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const DISCOUNT_LABELS: Record<string, string> = {
  NONE:       'Bez popusta',
  DATE_BASED: '10% vremenski popust',
  PROMO_CODE: '5% promo-kod popust',
  BOTH:       '10% + 5% kombinovani popust',
};

export function Step3PriceAndCurrency({ onNext, onBack }: Props) {
  const {
    selections, currency, promoCode, priceBreakdown,
    setCurrency, setPromoCode, setPriceBreakdown,
  } = useReservationStore();
  const { categories } = useSalonStore();

  const [currencies, setCurrencies]       = useState<AllowedCurrency[]>([]);
  const [promoInput, setPromoInput]       = useState(promoCode);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError]         = useState<string | null>(null);

  // Dohvati dozvoljene valute
  useEffect(() => {
    reservationService.getAllowedCurrencies()
      .then(setCurrencies)
      .catch(() => toast.error('Greška pri učitavanju valuta'));
  }, []);

  // Kalkuliši cijenu kad se promijeni valuta ili promo-kod
  const calculatePrice = useCallback(async (
    curr:  string,
    promo: string,
  ) => {
    const serviceIds = [...new Set(selections.map((s) => s.serviceId))];
    if (serviceIds.length === 0) return;

    setIsCalculating(true);
    setCalcError(null);

    try {
      const breakdown = await reservationService.calculatePrice(
        serviceIds,
        curr,
        promo || undefined,
      );
      setPriceBreakdown(breakdown);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Greška pri obračunu';
      setCalcError(msg);
      toast.error(msg);
    } finally {
      setIsCalculating(false);
    }
  }, [selections]);

  // Inicijalni obračun
  useEffect(() => {
    calculatePrice(currency, promoCode);
  }, [currency]);

  const handleCurrencyChange = (curr: string) => {
    setCurrency(curr);
    calculatePrice(curr, promoInput);
  };

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    setPromoCode(code);
    calculatePrice(currency, code);
  };

  const handleClearPromo = () => {
    setPromoInput('');
    setPromoCode('');
    calculatePrice(currency, '');
  };

  const handleNext = () => {
    if (!priceBreakdown) {
      toast.error('Obračun cijene nije završen');
      return;
    }
    onNext();
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Obračun cijene</h2>
        <p className={styles.stepDesc}>
          Odaberite valutu i unesite promo-kod ako ga posjedujete.
        </p>
      </div>

      <div className={styles.priceLayout}>

        {/* Lijeva kolona — kontrole */}
        <div className={styles.priceControls}>

          {/* Odabir valute */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Valuta plaćanja</label>
            <div className={styles.currencyGrid}>
              {currencies.map((cur) => (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => handleCurrencyChange(cur.code)}
                  className={`${styles.currencyBtn} ${currency === cur.code ? styles.currencyActive : ''}`}
                >
                  <span className={styles.currencyCode}>{cur.code}</span>
                  <span className={styles.currencyName}>{cur.naziv}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Promo-kod */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Promo-kod (opciono)</label>
            <div className={styles.promoRow}>
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="npr. TRAC-AB12CD"
                className={styles.input}
                maxLength={15}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={!promoInput.trim() || isCalculating}
                className={styles.promoApplyBtn}
              >
                Primijeni
              </button>
              {promoCode && (
                <button
                  type="button"
                  onClick={handleClearPromo}
                  className={styles.promoClearBtn}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status promo-koda */}
            {priceBreakdown && promoInput && (
              <div
                className={`${styles.promoStatus} ${
                  priceBreakdown.promoCodeApplied
                    ? styles.promoSuccess
                    : styles.promoError
                }`}
              >
                {priceBreakdown.promoCodeApplied ? '✅' : '❌'}{' '}
                {priceBreakdown.promoCodeMessage}
              </div>
            )}
          </div>

          {/* Odabrane usluge — lista */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Odabrane usluge</label>
            <div className={styles.selectedServicesList}>
              {selections.map((sel) => {
                const svc = categories
                  .flatMap((c) => c.services)
                  .find((s) => s.id === sel.serviceId);
                return (
                  <div key={`${sel.serviceId}-${sel.slotDatetime}`} className={styles.selectedServiceRow}>
                    <span>{svc?.naziv ?? `Usluga #${sel.serviceId}`}</span>
                    <span className={styles.selectedServiceTime}>
                      {new Date(sel.slotDatetime).toLocaleString('sr-RS', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className={styles.selectedServicePrice}>
                      {svc?.cenaRsd.toLocaleString('sr-RS')} RSD
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desna kolona — obračun */}
        <div className={styles.priceBreakdown}>
          <h3 className={styles.breakdownTitle}>Pregled cijene</h3>

          {isCalculating && (
            <div className={styles.calculating}>
              <div className={styles.calcSpinner} />
              <span>Obračunavanje...</span>
            </div>
          )}

          {calcError && !isCalculating && (
            <div className={styles.calcError}>{calcError}</div>
          )}

          {priceBreakdown && !isCalculating && (
            <div className={styles.breakdown}>

              {/* Osnovna cijena */}
              <div className={styles.breakdownRow}>
                <span>Osnovna cijena</span>
                <span>{priceBreakdown.basePriceRsd.toLocaleString('sr-RS')} RSD</span>
              </div>

              {/* Popust */}
              {priceBreakdown.discountType !== 'NONE' && (
                <div className={`${styles.breakdownRow} ${styles.breakdownDiscount}`}>
                  <span>
                    🏷 {DISCOUNT_LABELS[priceBreakdown.discountType]}
                  </span>
                  <span>
                    – {priceBreakdown.discountAmountRsd.toLocaleString('sr-RS')} RSD
                  </span>
                </div>
              )}

              {/* Separator */}
              <div className={styles.breakdownSeparator} />

              {/* Konačna cijena u RSD */}
              <div className={`${styles.breakdownRow} ${styles.breakdownTotal}`}>
                <span>Ukupno (RSD)</span>
                <span>{priceBreakdown.finalPriceRsd.toLocaleString('sr-RS')} RSD</span>
              </div>

              {/* Kurs + konvertovana cijena */}
              {currency !== 'RSD' && (
                <>
                  <div className={styles.breakdownRow}>
                    <span className={styles.rateLabel}>
                      Kurs (1 RSD = {priceBreakdown.exchangeRate.toFixed(6)} {currency})
                      {priceBreakdown.isStaleRate && (
                        <span className={styles.staleTag}> (cached)</span>
                      )}
                    </span>
                  </div>
                  <div className={`${styles.breakdownRow} ${styles.breakdownForeign}`}>
                    <span>Ukupno ({currency})</span>
                    <strong>
                      {priceBreakdown.finalPriceForeign.toFixed(2)} {currency}
                    </strong>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.formActions}>
        <button onClick={onBack} className={styles.btnBack}>← Nazad</button>
        <button
          onClick={handleNext}
          disabled={isCalculating || !priceBreakdown}
          className={styles.btnNext}
        >
          Nastavi na potvrdu →
        </button>
      </div>
    </div>
  );
}
