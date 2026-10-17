import { Container } from '../../layout/Container/Container';
import { SectionHeading } from '../../ui/SectionHeading/SectionHeading';
import { Botanical } from '../../ui/Botanical/Botanical';
import { menuCategories } from '../../../data/menu';
import type { MenuItem } from '../../../data/menu';
import styles from './Menu.module.css';

function formatPrice(price: number) {
  return `${price} ₴`;
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li className={styles.row}>
      <div className={styles.rowText}>
        <h3 className={styles.itemName}>{item.name}</h3>
        {item.description ? <p className={styles.itemDescription}>{item.description}</p> : null}
      </div>
      <span className={styles.price}>{formatPrice(item.price)}</span>
    </li>
  );
}

export function Menu() {
  return (
    <section id="menu" className={styles.menu} aria-labelledby="menu-title">
      <Botanical variant="rise" className={styles.vine} />
      <Container className={styles.grid}>
        <div className={styles.intro}>
          <SectionHeading
            id="menu-title"
            tone="dark"
            eyebrow="Меню"
            title="Кава, напої та випічка"
            description="Меню змінюється сезонно. Ціни вказано в гривнях."
          />
          <figure className={styles.media}>
            <img
              src="/images/menu-cheesecake-latte.jpg"
              alt="Шматок кавового чізкейку на керамічній тарілці та латте на дерев’яному столі"
              width={1600}
              height={2400}
              loading="lazy"
              decoding="async"
              className={styles.image}
            />
          </figure>
        </div>

        <div className={styles.categories}>
          {menuCategories.map((category) => (
            <section key={category.id} aria-labelledby={`menu-${category.id}`} className={styles.category}>
              <h3 id={`menu-${category.id}`} className={styles.categoryTitle}>
                {category.title}
              </h3>
              <ul className={styles.list}>
                {category.items.map((item) => (
                  <MenuRow key={item.name} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
