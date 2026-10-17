import styles from './Logo.module.css';

type LogoProps = {
  tone?: 'light' | 'dark';
};

// Wordmark: serif "Morrow" with a coffee-drop mark. Text is real HTML, so it stays selectable and translatable.
export function Logo({ tone = 'dark' }: LogoProps) {
  return (
    <span className={`${styles.logo} ${styles[tone]}`}>
      <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path
          d="M16 3c0 0-9 10.6-9 17a9 9 0 0 0 18 0c0-6.4-9-17-9-17z"
          fill="currentColor"
        />
        <circle cx="16" cy="20" r="3.2" className={styles.markCore} />
      </svg>
      <span className={styles.text}>
        <span className={styles.name}>Morrow</span>
        <span className={styles.sub}>Coffee</span>
      </span>
    </span>
  );
}
