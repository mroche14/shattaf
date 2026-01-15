
import React from 'react';
import { Clock, MapPin, ShieldPlus, Sparkles, Wallet } from 'lucide-react';
import { SITE } from '../siteConfig';

const base = import.meta.env.BASE_URL;

const Philosophy: React.FC = () => {
  return (
    <section id="philosophy" className="py-16 md:py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h2 className="text-cyan-400 text-xs font-black tracking-[0.4em] uppercase">Le Virage Culturel</h2>
          <h3 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold leading-tight tracking-tighter">Votre Corps Mérite <br/> <span className="cyan-gradient-text">Mieux que du Papier.</span></h3>
          <p className="text-gray-400 text-lg font-light leading-relaxed">
            Pourquoi le papier est-il la norme alors que l'eau est la source universelle de pureté ? Nous apportons en Guadeloupe la solution de bon sens utilisée par les cultures les plus avancées en matière d'hygiène.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              icon: ShieldPlus,
              title: "Hygiène Supérieure",
              desc: "Le papier essuie. L'eau nettoie. Le shattaf rince sans friction, puis vous séchez avec quelques feuilles."
            },
            {
              icon: Wallet,
              title: "Économies Réelles",
              desc: "Réduit fortement la consommation de papier (selon habitudes). Moins d'achats, moins de stockage, plus de confort au quotidien."
            },
            {
              icon: Sparkles,
              title: "Bien-être Quotidien",
              desc: "Retrouvez la sensation de fraîcheur d'une douche après chaque visite aux toilettes. Un confort essentiel sous notre climat tropical."
            }
          ].map((item, i) => (
            <div key={i} className="group p-6 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[36px] md:rounded-[48px] glass border-white/5 hover:border-cyan-500/30 transition-all hover:-translate-y-3">
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <item.icon className="w-10 h-10 text-cyan-400" />
              </div>
              <h4 className="text-2xl font-display font-bold mb-4">{item.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 md:mt-24 p-6 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[40px] md:rounded-[60px] glass gold-border-subtle flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 space-y-6">
            <h4 className="text-3xl font-display font-bold">Le Standard International, <span className="cyan-gradient-text">adapté à la Guadeloupe.</span></h4>
            <p className="text-gray-400 font-light leading-relaxed">
              Inspiré des pays où l'hygiène à l'eau est un standard, et pensé pour notre quotidien (calcaire, humidité, usage intensif). Nous sélectionnons des modèles robustes et nous assurons l'installation proprement, chez vous.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-2">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 mb-3">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-white font-black text-lg sm:text-2xl">~{SITE.offer.installationTimeMinutes} min</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-[0.18em] font-black">Installation</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 mb-3">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-white font-black text-lg sm:text-2xl">971</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-[0.18em] font-black">Guadeloupe</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 mb-3">
                  <ShieldPlus className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-white font-black text-lg sm:text-2xl">{SITE.offer.responseTime}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-[0.18em] font-black">Réponse</div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-[400px] aspect-video rounded-[20px] md:rounded-[40px] overflow-hidden group">
             <img 
               src={`${base}philosophy-bathroom.webp`} 
               alt="Salle de bain moderne"
               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
             />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
