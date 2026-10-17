import { LinkButton } from '../../ui/Button/Button';
import { Botanical } from '../../ui/Botanical/Botanical';
import { Container } from '../../layout/Container/Container';
import { cafe } from '../../../data/cafe';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Botanical variant="rise" className={styles.vine} />
      <Container className={styles.grid}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>{cafe.tagline}</p>
          <h1 id="hero-title" className={styles.title}>
            Тиха кава для ранкових розмов і довгих вечорів
          </h1>
          <p className={styles.lead}>
            Morrow — кав’ярня з м’яким світлом, каву малими партіями і випічку, яку пекуть уранці. Перегляньте
            вільні столики на потрібну дату і час, щоб не чекати на місце.
          </p>
          <div className={styles.actions}>
            <LinkButton href="#availability" variant="inverse">
              Перевірити доступність
            </LinkButton>
            <LinkButton href="#menu" variant="secondaryLight">
              Переглянути меню
            </LinkButton>
          </div>
          <p className={styles.note}>
            Вибір столика на сайті не є бронюванням. Узгодьте його з кав’ярнею напряму.
          </p>
        </div>

        <figure className={styles.media}>
          <img
            src="/images/hero-evening-cafe.jpg"
            alt="Затишний вечірній зал кав’ярні з дерев’яними столами та теплим світлом"
            width={1600}
            height={2400}
            fetchPriority="high"
            className={styles.image}
          />
        </figure>
      </Container>
    </section>
  );
}
