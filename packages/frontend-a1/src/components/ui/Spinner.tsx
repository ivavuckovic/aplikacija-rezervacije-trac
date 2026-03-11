import styles from './Spinner.module.css';

interface SpinnerProps {
  size?:    'sm' | 'md' | 'lg';
  message?: string;
  fullPage?: boolean;
}

export function Spinner({ size = 'md', message, fullPage }: SpinnerProps) {
  return (
    <div className={`${styles.wrapper} ${fullPage ? styles.fullPage : ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
