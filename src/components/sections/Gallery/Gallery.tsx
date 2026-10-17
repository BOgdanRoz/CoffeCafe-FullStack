import { Container } from '../../layout/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { Botanical } from '../../ui/Botanical/Botanical';
import { galleryItems } from '../../../data/gallery';
import styles from './Gallery.module.css';

export function Gallery() {
  return (
    <section id="gallery" className={styles.gallery} aria-labelledby="gallery-title">
      <Botanical variant="drape" mirrored className={styles.vine} />
      <Container className={styles.inner}>
        <SectionHeading
          id="gallery-title"
          eyebrow="Галерея"
          title="Простір, кава і випічка"
          description="Зал, напої та свіжа випічка."
        />

        <ul className={styles.grid}>
          {galleryItems.map((item) => (
            <li key={item.src} className={styles.item}>
              <figure className={styles.figure}>
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  decoding="async"
                  className={styles.image}
                />
                <figcaption className={styles.caption}>{item.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
