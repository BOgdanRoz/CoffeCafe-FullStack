import styles from './SectionHeading.module.css';

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  tone?: 'light' | 'dark';
};

export function SectionHeading({ id, eyebrow, title, description, tone = 'light' }: SectionHeadingProps) {
  return (
    <header className={`${styles.heading} ${styles[tone]}`}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {description ? <p className={styles.description}>{description}</p> : null}
    </header>
  );
}
