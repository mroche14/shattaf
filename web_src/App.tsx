
import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Philosophy from './components/Philosophy';
import HygieneDuel from './components/HygieneDuel';
import ProductGrid from './components/ProductGrid';
import BusinessSection from './components/BusinessSection';
import BookingSection from './components/BookingSection';
import FAQ from './components/FAQ';
import ChatConsultant from './components/ChatConsultant';
import { Droplets, Instagram, Facebook, Mail, MapPin, Phone, MessageCircle } from 'lucide-react';
import { SITE, formatTelLink, formatWhatsAppLink, isTruthyString } from './siteConfig';

const App: React.FC = () => {
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

      <footer className="glass border-t border-white/5 pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Droplets className="w-8 h-8 text-cyan-400" />
                <span className="font-display font-bold text-2xl tracking-tighter">OASIS <span className="text-cyan-400">SHATTAF</span></span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Redéfinir l'hygiène intime en Guadeloupe. Un virage culturel nécessaire pour votre santé, votre budget et notre île.
              </p>
              {(isTruthyString(SITE.contact.instagramUrl) || isTruthyString(SITE.contact.facebookUrl)) && (
                <div className="flex gap-4">
                  {isTruthyString(SITE.contact.instagramUrl) && (
                    <a
                      href={SITE.contact.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-cyan-500 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {isTruthyString(SITE.contact.facebookUrl) && (
                    <a
                      href={SITE.contact.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-cyan-500 transition-colors"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase text-[11px] text-gray-400 tracking-[0.18em]">Navigation</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#philosophy" className="hover:text-cyan-400">Notre Vision</a></li>
                <li><a href="#models" className="hover:text-cyan-400">La Gamme</a></li>
                <li><a href="#business" className="hover:text-cyan-400">Solutions Pro</a></li>
                <li><a href="#booking" className="hover:text-cyan-400">Installation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase text-[11px] text-gray-400 tracking-[0.18em]">Contact</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
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
                  <li className="flex items-center gap-3 text-white font-bold tracking-wider">
                    <Phone className="w-4 h-4 text-cyan-400" />
                    <a className="hover:text-cyan-300 transition-colors" href={telHref}>
                      {SITE.contact.phoneDisplay}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 uppercase text-[11px] text-gray-400 tracking-[0.18em]">Contact rapide</h4>
              <p className="text-gray-400 text-sm mb-6 font-light leading-relaxed">
                Une question avant de réserver ? Écrivez-nous et on vous répond sous {SITE.offer.responseTime}.
              </p>
              <div className="flex flex-col gap-3">
                {isTruthyString(whatsappHref) && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                )}
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('booking:setMode', { detail: { isPro: false } }));
                    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-4 rounded-2xl btn-primary text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.01] transition-all"
                >
                  Réserver une installation
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 text-center text-gray-500 text-[11px] uppercase tracking-[0.18em] font-bold">
            © {new Date().getFullYear()} {SITE.brand.name} — HYGIÈNE & BIEN-ÊTRE EN GUADELOUPE.
          </div>
        </div>
      </footer>

      <ChatConsultant />
    </div>
  );
};

export default App;
