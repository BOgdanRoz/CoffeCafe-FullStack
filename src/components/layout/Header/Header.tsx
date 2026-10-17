import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../ui/Logo/Logo';
import { LinkButton } from '../../ui/Button/Button';
import { Container } from '../Container/Container';
import styles from './Header.module.css';

const navigationLinks = [
  { href: '#about', label: 'Про нас' },
  { href: '#menu', label: 'Меню' },
  { href: '#availability', label: 'Столики' },
  { href: '#gallery', label: 'Галерея' },
  { href: '#contact', label: 'Контакти' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile menu and returns focus to its toggle button.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="Morrow Coffee, на головну сторінку" onClick={closeMenu}>
          <Logo tone="dark" />
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={isOpen}
          aria-controls="site-navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className={styles.toggleLabel}>{isOpen ? 'Закрити' : 'Меню сайту'}</span>
          <span className={styles.toggleIcon} aria-hidden="true" data-open={isOpen} />
        </button>

        <nav
          id="site-navigation"
          aria-label="Головна навігація"
          className={`${styles.nav} ${isOpen ? styles.navOpen : ''}`}
        >
          <ul className={styles.navList}>
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={styles.navLink} onClick={closeMenu}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <LinkButton href="#availability" className={styles.cta} onClick={closeMenu}>
            Перевірити столики
          </LinkButton>
        </nav>
      </Container>
    </header>
  );
}
