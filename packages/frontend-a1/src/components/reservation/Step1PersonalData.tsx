import { useForm }             from 'react-hook-form';
import { zodResolver }         from '@hookform/resolvers/zod';
import { z }                   from 'zod';
import { useReservationStore } from '../../store/reservationStore';
import styles                  from './Steps.module.css';

// Zod shema identična backend-u
const PersonalDataSchema = z.object({
  ime:           z.string().min(2, 'Ime mora imati bar 2 karaktera'),
  prezime:       z.string().min(2, 'Prezime mora imati bar 2 karaktera'),
  email:         z.string().email('Unesite ispravnu email adresu'),
  adresa:        z.string().min(3, 'Adresa je obavezna'),
  postanskiBroj: z.string().min(4, 'Unesite ispravan poštanski broj'),
  mesto:         z.string().min(2, 'Mjesto je obavezno'),
  drzava:        z.string().min(2, 'Država je obavezna'),
});

type FormData = z.infer<typeof PersonalDataSchema>;

interface Props {
  onNext: () => void;
}

export function Step1PersonalData({ onNext }: Props) {
  const { personalData, setPersonalData } = useReservationStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver:      zodResolver(PersonalDataSchema),
    defaultValues: personalData as FormData,
  });

  const onSubmit = (data: FormData) => {
    setPersonalData(data);
    onNext();
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Vaši podaci</h2>
        <p className={styles.stepDesc}>
          Popunite lične podatke za rezervaciju. Sva polja su obavezna.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        {/* Ime i prezime — u redu */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Ime <span className={styles.required}>*</span>
            </label>
            <input
              {...register('ime')}
              className={`${styles.input} ${errors.ime ? styles.inputError : ''}`}
              placeholder="npr. Marija"
            />
            {errors.ime && (
              <span className={styles.errorMsg}>{errors.ime.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Prezime <span className={styles.required}>*</span>
            </label>
            <input
              {...register('prezime')}
              className={`${styles.input} ${errors.prezime ? styles.inputError : ''}`}
              placeholder="npr. Petrović"
            />
            {errors.prezime && (
              <span className={styles.errorMsg}>{errors.prezime.message}</span>
            )}
          </div>
        </div>

        {/* Email */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Email adresa <span className={styles.required}>*</span>
          </label>
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

        {/* Adresa */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Adresa <span className={styles.required}>*</span>
          </label>
          <input
            {...register('adresa')}
            className={`${styles.input} ${errors.adresa ? styles.inputError : ''}`}
            placeholder="npr. Bulevar Oslobođenja 42"
          />
          {errors.adresa && (
            <span className={styles.errorMsg}>{errors.adresa.message}</span>
          )}
        </div>

        {/* Poštanski broj i Mesto */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Poštanski broj <span className={styles.required}>*</span>
            </label>
            <input
              {...register('postanskiBroj')}
              className={`${styles.input} ${errors.postanskiBroj ? styles.inputError : ''}`}
              placeholder="21000"
            />
            {errors.postanskiBroj && (
              <span className={styles.errorMsg}>{errors.postanskiBroj.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Mjesto <span className={styles.required}>*</span>
            </label>
            <input
              {...register('mesto')}
              className={`${styles.input} ${errors.mesto ? styles.inputError : ''}`}
              placeholder="npr. Novi Sad"
            />
            {errors.mesto && (
              <span className={styles.errorMsg}>{errors.mesto.message}</span>
            )}
          </div>
        </div>

        {/* Država */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Država <span className={styles.required}>*</span>
          </label>
          <input
            {...register('drzava')}
            className={`${styles.input} ${errors.drzava ? styles.inputError : ''}`}
            placeholder="npr. Srbija"
          />
          {errors.drzava && (
            <span className={styles.errorMsg}>{errors.drzava.message}</span>
          )}
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnNext}>
            Nastavi na odabir usluga →
          </button>
        </div>
      </form>
    </div>
  );
}
