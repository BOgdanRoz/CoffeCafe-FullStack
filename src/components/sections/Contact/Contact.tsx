import { Container } from '../../layout/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { Botanical } from '../../ui/Botanical/Botanical';
import { cafe } from '../../../data/cafe';
import styles from './Contact.module.css';

export function Contact() {
  return (
    <section id="contact" className={styles.contact} aria-labelledby="contact-title">
      <Botanical variant="drape" mirrored className={styles.vine} />
      <Container className={styles.inner}>
        <SectionHeading
          id="contact-title"
          tone="dark"
          eyebrow="Контакти"
          title="Як нас знайти"
          description="Заходьте без попередження або перевірте вільні столики на сайті. Для великих компаній і подій напишіть нам."
        />

        <div className={styles.grid}>
          <div className={styles.block}>
            <h3 className={styles.blockTitle}>Адреса</h3>
            <p>{cafe.address}</p>
          </div>

          <div className={styles.block}>
            <h3 className={styles.blockTitle}>Години роботи</h3>
            <ul className={styles.hours}>
              {cafe.openingHours.map((entry) => (
                <li key={entry.days} className={styles.hoursRow}>
                  <span>{entry.days}</span>
                  <span>{entry.hours}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.block}>
            <h3 className={styles.blockTitle}>Зв’язок</h3>
            <p>
              Телефон:{' '}
              <a href={cafe.phoneHref} className={styles.link}>
                {cafe.phone}
              </a>
            </p>
            <p>
              Instagram:{' '}
              <a href={cafe.instagramUrl} className={styles.link} target="_blank" rel="noopener noreferrer">
                Morrow Coffee
              </a>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
