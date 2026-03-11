import styles from './Spinner.module.css';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullPage?: boolean;
}

export function Spinner({ size = 'md', message, fullPage = false }: Props) {
  const sizeClass = {
    sm: styles.spinnerSm,
    md: styles.spinnerMd,
    lg: styles.spinnerLg,
  }[size];

  const content = (
    <div className={`${styles.spinner} ${sizeClass}`}>
      <div className={styles.spinnerInner} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className={styles.fullPage}>
        {content}
      </div>
    );
  }

  return content;
}
