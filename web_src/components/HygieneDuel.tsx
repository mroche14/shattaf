
import React from 'react';
import { Eraser, ShowerHead, Droplets, CheckCircle2, XCircle, TrendingDown } from 'lucide-react';

const HygieneDuel: React.FC = () => {
  return (
    <section className="py-12 md:py-24 relative overflow-hidden bg-[#020617]">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="text-cyan-400 text-xs font-black tracking-[0.4em] uppercase">Le Match de la Vérité</h2>
          <h3 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold">L'Analyse du <span className="cyan-gradient-text">Nettoyage.</span></h3>
          <p className="text-gray-400 font-light">Un schéma simple pour comprendre pourquoi l'hygiène à l'eau est devenue un standard dans de nombreux pays.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-stretch">
          {/* L'Ancien Monde */}
          <div className="glass p-6 md:p-10 rounded-[24px] md:rounded-[50px] border-red-500/10 relative group">
            <div className="absolute -top-4 -left-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-[11px] font-black uppercase tracking-[0.18em] border border-red-500/20">
              Papier seul
            </div>
            
            <div className="space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-400">
                  <Eraser size={32} />
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-display font-bold">Le Papier Seul</h4>
                  <p className="text-gray-500 text-sm">On essuie. Souvent, on doit repasser.</p>
                </div>
              </div>

              <div className="space-y-8 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-red-500/20">
                <div className="flex items-center gap-6 pl-14 relative">
                  <div className="absolute left-6 w-4 h-4 rounded-full border-4 border-red-500/40 bg-[#020617]"></div>
                  <div className="space-y-1">
                    <p className="text-white font-bold">Étape 1 : Friction répétée</p>
                    <p className="text-xs text-gray-500">Peut irriter les peaux sensibles.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pl-14 relative">
                  <div className="absolute left-6 w-4 h-4 rounded-full border-4 border-red-500/40 bg-[#020617]"></div>
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                    <p className="text-red-400 font-black text-sm uppercase italic">"Sensation d'inconfort persistant"</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pl-14 relative">
                  <div className="absolute left-6 w-4 h-4 rounded-full border-4 border-red-500/40 bg-[#020617]"></div>
                  <div className="flex items-center gap-3">
                    <ShowerHead className="text-red-400" />
                    <p className="text-white font-bold">Verdict : sensation “pas net”</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-3xl font-black text-red-400">14–21</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-[0.18em] font-black">Feuilles (selon habitudes)</p>
                </div>
                <XCircle className="text-red-500/40 w-12 h-12" />
              </div>
            </div>
          </div>

          {/* Le Monde Oasis */}
          <div className="glass p-6 md:p-10 rounded-[24px] md:rounded-[50px] border-cyan-500/20 relative gold-glow">
             <div className="absolute -top-4 -right-4 px-4 py-2 gold-bg text-black rounded-full text-[11px] font-black uppercase tracking-[0.18em] shadow-xl">
              Standard Oasis Shattaf
            </div>

            <div className="space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl btn-primary flex items-center justify-center text-white">
                  <Droplets size={32} />
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-display font-bold">Le Shattaf Oasis</h4>
                  <p className="text-cyan-400 text-sm font-bold">On purifie, on apaise, on revit.</p>
                </div>
              </div>

              <div className="space-y-8 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-cyan-500/20">
                <div className="flex items-center gap-6 pl-14 relative">
                  <div className="absolute left-6 w-4 h-4 rounded-full border-4 border-cyan-500/40 bg-[#020617]"></div>
                  <div className="space-y-1">
                    <p className="text-white font-bold">Étape 1 : Jet de précision</p>
                    <p className="text-xs text-gray-500">L'eau rince en douceur, sans friction.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pl-14 relative">
                  <div className="absolute left-6 w-4 h-4 rounded-full border-4 border-cyan-500/40 bg-[#020617]"></div>
                  <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                    <p className="cyan-gradient-text font-black text-sm uppercase italic">"Sensation douche fraîche immédiate"</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pl-14 relative">
                  <div className="absolute left-6 w-4 h-4 rounded-full border-4 border-cyan-500/40 bg-[#020617]"></div>
                  <div className="flex items-center gap-3">
                    <TrendingDown className="text-cyan-400" />
                    <p className="text-white font-bold">Séchage rapide (2–4 feuilles)</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-3xl font-black text-cyan-400">2–4</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-[0.18em] font-black">Feuilles (séchage)</p>
                </div>
                <CheckCircle2 className="text-cyan-400 w-12 h-12" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-16 text-center">
          <div className="inline-block glass px-4 sm:px-8 py-3 sm:py-4 rounded-full border-cyan-500/10">
            <p className="text-sm font-light text-gray-400 italic">
              "Laver ses mains sales avec du papier sec ? Vous ne le feriez jamais. Pourquoi faire exception pour le reste ?"
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HygieneDuel;
