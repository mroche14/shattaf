
import React from 'react';
import { ArrowRight, CheckCircle, Clock, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { SITE, formatWhatsAppLink, isTruthyString } from '../siteConfig';

const base = import.meta.env.BASE_URL;

const Hero: React.FC = () => {
  const whatsappHref = formatWhatsAppLink(
    SITE.contact.whatsappE164,
    "Bonjour, je voudrais une installation Shattaf en Guadeloupe. Pouvez-vous m'aider ?"
  );

  return (
    <section className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 -left-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass border-cyan-500/20">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 text-[11px] font-black tracking-[0.22em] uppercase">Installation 971 — Hygiène à l’eau</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-extrabold leading-[0.95] tracking-tighter">
            Douchette WC <br />
            <span className="cyan-gradient-text">(Shattaf) installée chez vous.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-xl leading-relaxed font-light">
            Un confort “sortie de douche” après chaque passage aux toilettes. Moins de papier, plus de fraîcheur.
            <span className="text-white font-medium"> Installation incluse</span> en ~{SITE.offer.installationTimeMinutes} min, partout en Guadeloupe.
          </p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('booking:setMode', { detail: { isPro: false } }));
                  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-10 py-5 rounded-2xl btn-primary text-white font-black text-lg shadow-2xl flex items-center justify-center gap-3 uppercase tracking-wider"
              >
                Réserver mon installation <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.getElementById('models')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 rounded-2xl glass border-white/10 hover:bg-white/5 transition-all font-bold text-lg uppercase tracking-wider"
              >
                Voir la gamme
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
              <div className="text-gray-400 font-light">
                À partir de <span className="text-white font-bold">{SITE.offer.minPriceEUR}€</span>
                {SITE.offer.includesInstallation ? <span className="text-gray-500"> — installation incluse</span> : null}
              </div>
              {isTruthyString(whatsappHref) && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-200 hover:text-emerald-100 font-bold"
                >
                  <MessageCircle className="w-4 h-4" /> Ou poser une question sur WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">Réponse sous {SITE.offer.responseTime}</span>
                <span className="text-gray-400 text-[11px] uppercase font-black tracking-[0.18em]">Conseil & SAV local</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">Installation ~{SITE.offer.installationTimeMinutes} min</span>
                <span className="text-gray-400 text-[11px] uppercase font-black tracking-[0.18em]">Intervention 971</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="relative glass rounded-[50px] p-4 animate-float cyan-glow overflow-hidden">
            <div className="grid grid-cols-2 gap-4 h-[580px]">
              <div className="relative overflow-hidden rounded-[40px]">
                <img 
                  src={`${base}hero-dubai.png`} 
                  alt="Salle de bain premium (inspiration)"
                  className="w-full h-full object-cover brightness-75 transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[11px] font-black uppercase text-white tracking-[0.2em]">Standard premium</div>
              </div>
              <div className="relative overflow-hidden rounded-[40px]">
                <img 
                  src={`${base}hero-guadeloupe.png`} 
                  alt="Guadeloupe Island"
                  className="w-full h-full object-cover brightness-75 transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[11px] font-black uppercase text-white tracking-[0.2em]">Guadeloupe (971)</div>
              </div>
            </div>
            <div className="absolute bottom-10 left-10 right-10 glass p-8 rounded-[32px] border-cyan-500/20">
               <div className="flex items-center gap-3 mb-3">
                 <CheckCircle className="w-5 h-5 text-cyan-400" />
                 <span className="gold-text text-xs uppercase font-black tracking-[0.2em]">Confort quotidien</span>
               </div>
               <p className="text-white font-medium leading-relaxed italic">
                 "Une fois essayé, on ne revient plus en arrière. La différence se sent dès le premier jour."
               </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
