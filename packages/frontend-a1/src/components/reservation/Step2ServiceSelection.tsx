import { useState, useEffect }   from 'react';
import toast                     from 'react-hot-toast';
import { useSalonStore }         from '../../store/salonStore';
import { useReservationStore }   from '../../store/reservationStore';
import { servicesService }       from '../../services/servicesService';
import type { TimeSlot, Service } from '../../types';
import styles                    from './Steps.module.css';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

// Format datuma za input[type=date]
function todayStr()  {
  return new Date().toISOString().split('T')[0];
}
function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString('sr-RS', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function Step2ServiceSelection({ onNext, onBack }: Props) {
  const { categories }                          = useSalonStore();
  const { selections, addSelection, removeSelection } = useReservationStore();

  // State po usluzi: koji datum je izabran i koji slotovi su učitani
  const [selectedDates, setSelectedDates]   = useState<Record<number, string>>({});
  const [slotsByService, setSlotsByService] = useState<Record<number, TimeSlot[]>>({});
  const [loadingSlots, setLoadingSlots]     = useState<Record<number, boolean>>({});

  // Učitaj termine za uslugu na dati datum
  const loadSlots = async (serviceId: number, date: string) => {
    setLoadingSlots((p) => ({ ...p, [serviceId]: true }));
    try {
      const slots = await servicesService.getAvailableSlots(serviceId, date);
      setSlotsByService((p) => ({ ...p, [serviceId]: slots }));
    } catch {
      toast.error('Greška pri učitavanju termina');
    } finally {
      setLoadingSlots((p) => ({ ...p, [serviceId]: false }));
    }
  };

  const handleDateChange = (serviceId: number, date: string) => {
    setSelectedDates((p) => ({ ...p, [serviceId]: date }));
    loadSlots(serviceId, date);
  };

  const handleSlotToggle = (service: Service, slot: TimeSlot) => {
    const existing = selections.find(
      (s) => s.serviceId === service.id && s.slotDatetime === slot.datetimeStr,
    );
    if (existing) {
      removeSelection(service.id, slot.datetimeStr);
    } else {
      addSelection({ serviceId: service.id, slotDatetime: slot.datetimeStr });
      toast.success(`Termin ${formatTime(slot.datetimeStr)} dodan`);
    }
  };

  const isSlotSelected = (serviceId: number, slotStr: string) =>
    selections.some((s) => s.serviceId === serviceId && s.slotDatetime === slotStr);

  const handleNext = () => {
    if (selections.length === 0) {
      toast.error('Odaberite bar jednu uslugu i termin');
      return;
    }
    onNext();
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Odaberite usluge i termine</h2>
        <p className={styles.stepDesc}>
          Izaberite datum za svaku uslugu i kliknite na slobodan termin.
        </p>
      </div>

      {/* Odabrane usluge — summary */}
      {selections.length > 0 && (
        <div className={styles.selectionSummary}>
          <h4>✅ Odabrano ({selections.length}):</h4>
          <div className={styles.selectionList}>
            {selections.map((sel) => {
              const svc = categories
                .flatMap((c) => c.services)
                .find((s) => s.id === sel.serviceId);
              return (
                <div key={`${sel.serviceId}-${sel.slotDatetime}`} className={styles.selectionItem}>
                  <span>
                    <strong>{svc?.naziv}</strong> — {formatTime(sel.slotDatetime)},{' '}
                    {new Date(sel.slotDatetime).toLocaleDateString('sr-RS')}
                  </span>
                  <button
                    onClick={() => removeSelection(sel.serviceId, sel.slotDatetime)}
                    className={styles.removeBtn}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kategorije i usluge */}
      <div className={styles.categoriesAccordion}>
        {categories.map((cat) => (
          <div key={cat.id} className={styles.categoryGroup}>
            <h3 className={styles.categoryTitle}>{cat.naziv}</h3>

            <div className={styles.servicesAccordion}>
              {cat.services.map((svc) => (
                <ServiceSlotPicker
                  key={svc.id}
                  service={svc}
                  date={selectedDates[svc.id] ?? ''}
                  slots={slotsByService[svc.id] ?? []}
                  isLoading={loadingSlots[svc.id] ?? false}
                  isSlotSelected={(slot) => isSlotSelected(svc.id, slot.datetimeStr)}
                  onDateChange={(d) => handleDateChange(svc.id, d)}
                  onSlotToggle={(slot) => handleSlotToggle(svc, slot)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.formActions}>
        <button onClick={onBack} className={styles.btnBack}>
          ← Nazad
        </button>
        <button onClick={handleNext} className={styles.btnNext}>
          Nastavi na cijenu →
        </button>
      </div>
    </div>
  );
}

// ── Sub-komponenta: picker za jednu uslugu ─────────────
interface ServiceSlotPickerProps {
  service:        Service;
  date:           string;
  slots:          TimeSlot[];
  isLoading:      boolean;
  isSlotSelected: (slot: TimeSlot) => boolean;
  onDateChange:   (date: string) => void;
  onSlotToggle:   (slot: TimeSlot) => void;
}

function ServiceSlotPicker({
  service, date, slots, isLoading, isSlotSelected, onDateChange, onSlotToggle,
}: ServiceSlotPickerProps) {
  const [expanded, setExpanded] = useState(false);

  const hasSelected = slots.some((s) => isSlotSelected(s));

  return (
    <div className={`${styles.serviceAccordion} ${hasSelected ? styles.serviceAccordionSelected : ''}`}>
      {/* Header — klik otvara/zatvara */}
      <button
        className={styles.accordionHeader}
        onClick={() => setExpanded((p) => !p)}
        type="button"
      >
        <div className={styles.accordionInfo}>
          <span className={styles.accordionName}>{service.naziv}</span>
          <span className={styles.accordionMeta}>
            ⏱ {service.trajanjeMin}min &nbsp;|&nbsp;
            💰 {service.cenaRsd.toLocaleString('sr-RS')} RSD
          </span>
        </div>
        <div className={styles.accordionRight}>
          {hasSelected && <span className={styles.selectedBadge}>✓ Odabrano</span>}
          <span className={styles.chevron}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Sadržaj */}
      {expanded && (
        <div className={styles.accordionBody}>
          {/* Date picker */}
          <div className={styles.datePicker}>
            <label className={styles.dateLabel}>Odaberite datum:</label>
            <input
              type="date"
              min={todayStr()}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className={styles.dateInput}
            />
          </div>

          {/* Slobodni termini */}
          {date && (
            <div className={styles.slotsSection}>
              {isLoading ? (
                <div className={styles.slotsLoading}>Učitavanje termina...</div>
              ) : slots.length === 0 ? (
                <div className={styles.noSlots}>
                  Nema dostupnih termina za odabrani datum
                </div>
              ) : (
                <div className={styles.slotsGrid}>
                  {slots.map((slot) => {
                    const selected = isSlotSelected(slot);
                    return (
                      <button
                        key={slot.datetimeStr}
                        type="button"
                        disabled={slot.isFull && !selected}
                        onClick={() => !slot.isFull || selected ? onSlotToggle(slot) : null}
                        className={`
                          ${styles.slotBtn}
                          ${selected   ? styles.slotSelected : ''}
                          ${slot.isFull && !selected ? styles.slotFull : ''}
                        `}
                        title={
                          slot.isFull
                            ? 'Termin je popunjen'
                            : `${slot.availableSpots} slobodnih mjesta`
                        }
                      >
                        <span className={styles.slotTime}>
                          {formatTime(slot.datetimeStr)}
                        </span>
                        <span className={styles.slotSpots}>
                          {slot.isFull
                            ? 'Popunjeno'
                            : `${slot.availableSpots}/${slot.maxSpots}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
