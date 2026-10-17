import { Container } from '../../layout/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { Botanical } from '../../ui/Botanical/Botanical';
import styles from './About.module.css';

const highlights = [
  {
    title: 'Мала обсмажка',
    text: 'Зерно обсмажуємо невеликими партіями, щоб смак залишався чистим і збалансованим.',
  },
  {
    title: 'Випічка щоранку',
    text: 'Круасани та кекси готуємо вдень раніше, щоб до відкриття вони були свіжими.',
  },
  {
    title: 'Тепла атмосфера',
    text: 'Дерево, м’яке світло і тихі столики для розмов або роботи з ноутбуком.',
  },
];

export function About() {
  return (
    <section id="about" className={styles.about} aria-labelledby="about-title">
      <Botanical variant="drape" mirrored className={styles.vine} />
      <Container className={styles.grid}>
        <figure className={styles.media}>
          <img
            src="/images/about-warm-interior.jpg"
            alt="Теплий інтер’єр кав’ярні з дерев’яним столом, керамічною чашкою та світлими стільцями"
            width={1600}
            height={2400}
            loading="lazy"
            decoding="async"
            className={styles.image}
          />
        </figure>

        <div className={styles.content}>
          <SectionHeading
            id="about-title"
            eyebrow="Про нас"
            title="Morrow — місце, де кава не поспішає"
          />
          <div className={styles.text}>
            <p>
              Назва Morrow означає «ранок», але ми відкриті й для вечірніх розмов. Ідея проста: добра кава, чесна
              випічка і простір, де приємно залишитися на годину довше.
            </p>
            <p>
              Ми працюємо з невеликими обсмажувачами і міняємо склад меню залежно від сезону, тож завжди є щось
              нове для спробування.
            </p>
          </div>

          <ul className={styles.highlights}>
            {highlights.map((item) => (
              <li key={item.title} className={styles.highlight}>
                <h3 className={styles.highlightTitle}>{item.title}</h3>
                <p className={styles.highlightText}>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
