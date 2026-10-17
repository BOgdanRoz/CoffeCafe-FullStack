import { Logo } from '../../ui/Logo/Logo';
import { cafe } from '../../../data/cafe';
import { Container } from '../Container/Container';
import styles from './Footer.module.css';

const footerLinks = [
  { href: '#about', label: 'Про нас' },
  { href: '#menu', label: 'Меню' },
  { href: '#gallery', label: 'Галерея' },
  { href: '#availability', label: 'Столики' },
  { href: '#contact', label: 'Контакти' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.brand}>
          <Logo tone="light" />
        </div>

        <nav aria-label="Навігація у футері" className={styles.nav}>
          <ul className={styles.list}>
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={styles.link}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className={styles.copyright}>
          © {currentYear} {cafe.name}. Усі права захищено.
        </p>
      </Container>
    </footer>
  );
}
