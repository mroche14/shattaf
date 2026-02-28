import React from 'react';
import Header from '../../components/landing/Header';
import Hero from '../../components/landing/Hero';
import Philosophy from '../../components/landing/Philosophy';
import HygieneDuel from '../../components/landing/HygieneDuel';
import ProductGrid from '../../components/landing/ProductGrid';
import BusinessSection from '../../components/landing/BusinessSection';
import BookingSection from '../../components/landing/BookingSection';
import FAQ from '../../components/landing/FAQ';
import { Droplets, Instagram, Facebook, Mail, MapPin, Phone, MessageCircle } from 'lucide-react';
import { SITE, formatTelLink, formatWhatsAppLink, isTruthyString } from '../../siteConfig';

const HomePage: React.FC = () => {
  const telHref = formatTelLink(SITE.contact.phoneE164);
  const whatsappHref = formatWhatsAppLink(
    SITE.contact.whatsappE164,
    "Bonjour, je voudrais une installation Shattaf en Guadeloupe. Pouvez-vous m'aider ?"
  );

  return (
    <div className="min-h-screen selection:bg-cyan-500/30">
      <Header />

      <main>
        <Hero />
        <Philosophy />
        <HygieneDuel />
        <ProductGrid />
        <BusinessSection />
        <BookingSection />
        <FAQ />
      </main>

      <footer className="glass border-t border-[var(--border-color)] pt-12 md:pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Droplets className="w-8 h-8 text-cyan-400" />
                <span className="font-display font-bold text-2xl tracking-tighter text-[var(--text-main)]">OASIS <span className="text-cyan-400">SHATTAF</span></span>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-light">
                Redéfinir l'hygiène intime en Guadeloupe. Un virage culturel nécessaire pour votre santé, votre budget et notre île.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase text-[11px] text-[var(--text-tertiary)] tracking-[0.18em]">Navigation</h4>
              <ul className="space-y-4 text-[var(--text-secondary)] text-sm">
                <li><a href="#philosophy" className="hover:text-cyan-400 transition-colors">Notre Vision</a></li>
                <li><a href="#models" className="hover:text-cyan-400 transition-colors">La Gamme</a></li>
                <li><a href="#business" className="hover:text-cyan-400 transition-colors">Solutions Pro</a></li>
                <li><a href="#booking" className="hover:text-cyan-400 transition-colors">Installation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase text-[11px] text-[var(--text-tertiary)] tracking-[0.18em]">Contact</h4>
              <ul className="space-y-4 text-[var(--text-secondary)] text-sm">
                {isTruthyString(SITE.contact.email) && (
                  <li className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <a className="hover:text-cyan-400 transition-colors" href={`mailto:${SITE.contact.email}`}>
                      {SITE.contact.email}
                    </a>
                  </li>
                )}
                {isTruthyString(SITE.contact.address) && (
                  <li className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-cyan-400" /> {SITE.contact.address}
                  </li>
                )}
                {isTruthyString(SITE.contact.phoneDisplay) && isTruthyString(telHref) && (
                  <li className="flex items-center gap-3 text-[var(--text-main)] font-bold tracking-wider">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    <a className="hover:text-cyan-300 transition-colors" href={telHref}>
                      {SITE.contact.phoneDisplay}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase text-[11px] text-[var(--text-tertiary)] tracking-[0.18em]">Contact rapide</h4>
              <p className="text-[var(--text-secondary)] text-sm mb-6 font-light leading-relaxed">
                Une question ? Écrivez-nous.
              </p>
              <button
                onClick={() => {
                  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full px-5 py-4 rounded-2xl btn-primary text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3"
              >
                Réserver une installation
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--border-color)] text-center text-[var(--text-tertiary)] text-[11px] uppercase tracking-[0.18em] font-bold">
            © {new Date().getFullYear()} {SITE.brand.name} — HYGIÈNE & BIEN-ÊTRE EN GUADELOUPE.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
