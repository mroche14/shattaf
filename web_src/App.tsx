
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
import { Droplets, Instagram, Facebook, Mail, MapPin } from 'lucide-react';

const App: React.FC = () => {
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
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-cyan-500 transition-colors"><Instagram className="w-5 h-5"/></a>
                <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-cyan-500 transition-colors"><Facebook className="w-5 h-5"/></a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 tracking-widest uppercase text-[10px] text-gray-500">Navigation</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#philosophy" className="hover:text-cyan-400">Notre Vision</a></li>
                <li><a href="#models" className="hover:text-cyan-400">La Gamme</a></li>
                <li><a href="#business" className="hover:text-cyan-400">Solutions Pro</a></li>
                <li><a href="#booking" className="hover:text-cyan-400">Installation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 tracking-widest uppercase text-[10px] text-gray-500">Contact</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-cyan-400"/> contact@oasis-shattaf.gp</li>
                <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-cyan-400"/> Baie-Mahault, Guadeloupe</li>
                <li className="flex items-center gap-3 text-white font-bold tracking-wider">+590 690 XX XX XX</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 tracking-widest uppercase text-[10px] text-gray-500">Newsletter</h4>
              <p className="text-gray-400 text-xs mb-4">Rejoignez la révolution de l'hygiène.</p>
              <div className="flex gap-2">
                <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex-1 text-xs outline-none focus:border-cyan-400" placeholder="Email"/>
                <button className="px-4 py-2 btn-primary rounded-xl font-bold text-[10px] uppercase tracking-widest">OK</button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 text-center text-gray-600 text-[10px] uppercase tracking-[0.2em] font-bold">
            © {new Date().getFullYear()} OASIS SHATTAF — HYGIÈNE & BIEN-ÊTRE EN GUADELOUPE.
          </div>
        </div>
      </footer>

      <ChatConsultant />
    </div>
  );
};

export default App;
