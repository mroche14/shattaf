
import React from 'react';
import { Droplets, ShieldCheck, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 -left-20 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass border-cyan-500/20">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-[10px] font-black tracking-[0.3em] uppercase">Révolution Bien-être en Guadeloupe</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-extrabold leading-[0.95] tracking-tighter">
            L'Eau, Bien <br /> 
            <span className="cyan-gradient-text">Mieux que le Papier.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-xl leading-relaxed font-light">
            Inspiré par les standards d'excellence de <span className="text-white font-medium">Dubaï et du Japon</span>, Oasis Shattaf apporte l'hygiène absolue dans votre foyer. Économique, écologique et infiniment plus frais.
          </p>

          <div className="flex flex-col sm:flex-row gap-5">
            <button 
              onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 rounded-2xl btn-primary text-white font-black text-lg shadow-2xl flex items-center justify-center gap-3 uppercase tracking-wider"
            >
              Réserver mon installation <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => document.getElementById('philosophy')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 rounded-2xl glass border-white/10 hover:bg-white/5 transition-all font-bold text-lg uppercase tracking-wider"
            >
              Pourquoi l'Eau ?
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">Hygiène Totale</span>
                <span className="text-gray-500 text-[10px] uppercase font-black">Santé & Confort</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">-90% de Papier</span>
                <span className="text-gray-500 text-[10px] uppercase font-black">Économie Mensuelle</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="relative glass rounded-[50px] p-4 animate-float cyan-glow overflow-hidden">
            <div className="grid grid-cols-2 gap-4 h-[580px]">
              <div className="relative overflow-hidden rounded-[40px]">
                <img 
                  src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=800&auto=format&fit=crop" 
                  alt="Dubaï Inspiration"
                  className="w-full h-full object-cover brightness-75 transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[8px] font-black uppercase text-white tracking-widest">Inspiration Dubaï</div>
              </div>
              <div className="relative overflow-hidden rounded-[40px]">
                <img 
                  src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop" 
                  alt="Guadeloupe Island"
                  className="w-full h-full object-cover brightness-75 transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-[8px] font-black uppercase text-white tracking-widest">Vivre en Guadeloupe</div>
              </div>
            </div>
            <div className="absolute bottom-10 left-10 right-10 glass p-8 rounded-[32px] border-cyan-500/20">
               <div className="flex items-center gap-3 mb-3">
                 <CheckCircle className="w-5 h-5 text-cyan-400" />
                 <span className="gold-text text-xs uppercase font-black tracking-widest">Expérience Oasis Shattaf</span>
               </div>
               <p className="text-white font-medium leading-relaxed italic">"Le passage du papier à l'eau n'est pas juste un achat, c'est un gain de dignité et de bien-être au quotidien."</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
