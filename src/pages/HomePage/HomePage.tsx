import { Header } from '../../components/layout/Header/Header';
import { Footer } from '../../components/layout/Footer/Footer';
import { Hero } from '../../components/sections/Hero/Hero';
import { About } from '../../components/sections/About/About';
import { Menu } from '../../components/sections/Menu/Menu';
import { Gallery } from '../../components/sections/Gallery/Gallery';
import { Availability } from '../../components/sections/Availability/Availability';
import { Contact } from '../../components/sections/Contact/Contact';

export function HomePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Перейти до вмісту
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <About />
        <Menu />
        <Gallery />
        <Availability />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
