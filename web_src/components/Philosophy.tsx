
import React from 'react';
import { ShieldPlus, Wallet, Sparkles } from 'lucide-react';

const Philosophy: React.FC = () => {
  return (
    <section id="philosophy" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h2 className="text-cyan-400 text-xs font-black tracking-[0.4em] uppercase">Le Virage Culturel</h2>
          <h3 className="text-5xl md:text-6xl font-display font-bold leading-tight tracking-tighter">Votre Corps Mérite <br/> <span className="cyan-gradient-text">Mieux que du Papier.</span></h3>
          <p className="text-gray-400 text-lg font-light leading-relaxed">
            Pourquoi le papier est-il la norme alors que l'eau est la source universelle de pureté ? Nous apportons en Guadeloupe la solution de bon sens utilisée par les cultures les plus avancées en matière d'hygiène.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              icon: ShieldPlus,
              title: "Hygiène Supérieure",
              desc: "Le papier toilette étale les bactéries et irrite les tissus sensibles. L'eau pulvérisée nettoie en profondeur, sans contact, garantissant une propreté clinique."
            },
            {
              icon: Wallet,
              title: "Économies Réelles",
              desc: "Le foyer moyen économise des centaines d'euros chaque année en réduisant sa consommation de papier. Un investissement rentable dès les premiers mois."
            },
            {
              icon: Sparkles,
              title: "Bien-être Quotidien",
              desc: "Retrouvez la sensation de fraîcheur d'une douche après chaque visite aux toilettes. Un confort essentiel sous notre climat tropical."
            }
          ].map((item, i) => (
            <div key={i} className="group p-12 rounded-[48px] glass border-white/5 hover:border-cyan-500/30 transition-all hover:-translate-y-3">
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <item.icon className="w-10 h-10 text-cyan-400" />
              </div>
              <h4 className="text-2xl font-display font-bold mb-4">{item.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 p-12 rounded-[60px] glass gold-border-subtle flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h4 className="text-3xl font-display font-bold">Inspiré par l'Excellence Mondiale</h4>
            <p className="text-gray-400 font-light leading-relaxed">
              Le Japon et les pays du Golfe (Dubaï) ont compris depuis longtemps que l'eau est irremplaçable. Oasis Shattaf adapte ces technologies de pointe à la Guadeloupe pour un mode de vie plus sain et moderne.
            </p>
            <div className="flex gap-6">
               <div className="text-center">
                 <div className="text-white font-black text-2xl">98%</div>
                 <div className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Satisfaction Client</div>
               </div>
               <div className="text-center">
                 <div className="text-white font-black text-2xl">-80%</div>
                 <div className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Déchets Papier</div>
               </div>
            </div>
          </div>
          <div className="w-full md:w-[400px] aspect-video rounded-[40px] overflow-hidden group">
             <img 
               src="https://images.unsplash.com/photo-1507652313519-d451e12d5948?q=80&w=800&auto=format&fit=crop" 
               alt="Luxury Bathroom Design"
               className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
             />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
