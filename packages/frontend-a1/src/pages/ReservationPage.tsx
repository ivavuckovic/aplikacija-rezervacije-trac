import { useEffect }              from 'react';
import { useSalonStore }          from '../store/salonStore';
import { useReservationStore }    from '../store/reservationStore';
import { StepIndicator }          from '../components/reservation/StepIndicator';
import { Step1PersonalData }      from '../components/reservation/Step1PersonalData';
import { Step2ServiceSelection }  from '../components/reservation/Step2ServiceSelection';
import { Step3PriceAndCurrency }  from '../components/reservation/Step3PriceAndCurrency';
import { Step4Confirmation }      from '../components/reservation/Step4Confirmation';
import { Spinner }                from '../components/ui/Spinner';
import styles                     from './ReservationPage.module.css';

export function ReservationPage() {
  const { categories, isLoading, fetchCategories } = useSalonStore();
  const { step, setStep, resetForm }               = useReservationStore();

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, []);

  useEffect(() => {
    // Reset pri prvom dolasku na stranicu (osim ako polling)
    return () => {/* cleanup */};
  }, []);

  if (isLoading && categories.length === 0) {
    return <Spinner size="lg" message="Učitavanje usluga..." fullPage />;
  }

  const goNext = () => setStep((step + 1) as any);
  const goBack = () => setStep((step - 1) as any);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Rezervacija termina</h1>
        <p className={styles.subtitle}>Salon Trač — online rezervacija</p>
      </div>

      <div className={styles.card}>
        <StepIndicator currentStep={step} />

        {step === 1 && <Step1PersonalData  onNext={goNext} />}
        {step === 2 && <Step2ServiceSelection onNext={goNext} onBack={goBack} />}
        {step === 3 && <Step3PriceAndCurrency onNext={goNext} onBack={goBack} />}
        {step === 4 && <Step4Confirmation  onBack={goBack} />}
      </div>
    </div>
  );
}
