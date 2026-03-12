import styles from './StepIndicator.module.css';

interface Step {
  number: number;
  label:  string;
  icon:   string;
}

const STEPS: Step[] = [
  { number: 1, label: 'Vaši podaci',    icon: '👤' },
  { number: 2, label: 'Usluge',         icon: '💆' },
  { number: 3, label: 'Cena',           icon: '💶' },
  { number: 4, label: 'Potvrda',        icon: '✅' },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className={styles.wrapper}>
      {STEPS.map((step, index) => {
        const isDone   = step.number < currentStep;
        const isActive = step.number === currentStep;

        return (
          <div key={step.number} className={styles.stepWrapper}>
            {/* Connector linija */}
            {index > 0 && (
              <div
                className={`${styles.connector} ${isDone || isActive ? styles.connectorActive : ''}`}
              />
            )}

            {/* Step krug */}
            <div className={styles.step}>
              <div
                className={`
                  ${styles.circle}
                  ${isDone   ? styles.done   : ''}
                  ${isActive ? styles.active : ''}
                `}
              >
                {isDone ? '✓' : step.icon}
              </div>
              <span
                className={`
                  ${styles.label}
                  ${isActive ? styles.labelActive : ''}
                  ${isDone   ? styles.labelDone   : ''}
                `}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
