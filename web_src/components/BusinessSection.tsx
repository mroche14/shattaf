
import React from 'react';
import { Building2, Hotel, Briefcase, BadgeCheck } from 'lucide-react';
import { SITE } from '../siteConfig';

const BusinessSection: React.FC = () => {
  return (
    <section id="business" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-cyan-400 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6">
        <div className="glass p-12 md:p-20 rounded-[60px] border-cyan-500/10 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-[11px] font-black tracking-[0.22em] uppercase">Solutions B2B & Hôtellerie</span>
            </div>
            
            <h3 className="text-4xl md:text-6xl font-display font-black leading-tight tracking-tighter">
              Élevez le Standard de <br/> <span className="cyan-gradient-text">Votre Établissement.</span>
            </h3>
            
            <p className="text-gray-400 text-lg font-light leading-relaxed">
              Hôtels, villas, Airbnb et espaces pro en Guadeloupe : offrez une expérience premium et mémorable. Installation en volume, planning adapté, et support local.
            </p>

            <div className="grid sm:grid-cols-2 gap-8">
              {[
                { icon: Hotel, title: "Hôtels & Villas", desc: "Augmentez votre score de satisfaction client." },
                { icon: Briefcase, title: "Espaces Pro", desc: "Un environnement de travail sain et moderne." },
                { icon: BadgeCheck, title: "Maintenance", desc: "Option maintenance & support prioritaire." },
                { icon: Building2, title: "Volume", desc: "Tarification dégressive sur-mesure dès 10 unités." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/5 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-white font-bold text-sm uppercase tracking-wider">{item.title}</h5>
                    <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('booking:setMode', { detail: { isPro: true } }));
                document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-10 py-5 rounded-2xl btn-primary text-white font-black text-sm uppercase tracking-widest shadow-xl"
            >
              Demander un devis Pro
            </button>
            <p className="text-gray-500 text-[11px] font-black uppercase tracking-[0.18em]">Réponse sous {SITE.offer.responseTime}</p>
          </div>

          <div className="w-full lg:w-1/3 aspect-[3/4] rounded-[50px] overflow-hidden shadow-2xl relative group">
            <img 
              src="/business-installation.png" 
              alt="Installation Professionnelle"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/40 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessSection;
