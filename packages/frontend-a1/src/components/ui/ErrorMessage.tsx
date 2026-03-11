import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message:  string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.container} role="alert">
      <span className={styles.icon}>⚠</span>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          Pokušaj ponovo
        </button>
      )}
    </div>
  );
}
