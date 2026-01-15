
import React from 'react';
import { PRODUCTS } from '../constants';
import { Check, Star, Wrench } from 'lucide-react';
import { SITE } from '../siteConfig';

const ProductGrid: React.FC = () => {
  return (
    <section id="models" className="py-16 md:py-32 bg-[#010413]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-24 gap-8 md:gap-12 text-center md:text-left">
          <div className="space-y-4">
            <h2 className="text-cyan-400 text-xs font-black tracking-[0.4em] uppercase">La Collection</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-none tracking-tighter">Précision & <span className="gold-text">Confort.</span></h3>
          </div>
          <p className="text-gray-400 max-w-md font-light text-lg">
            Chaque modèle est sélectionné pour sa robustesse face au calcaire et son design parfaitement intégré.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-10">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="group flex flex-col h-full glass rounded-[24px] md:rounded-[50px] overflow-hidden border-white/5 hover:border-cyan-500/30 transition-all duration-700">
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-900">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 md:top-6 md:right-6 px-4 md:px-5 py-2 rounded-full glass border-white/20 font-black text-lg md:text-xl">
                  {product.price}€
                </div>
                {product.id === 'oasis-royal-gold' && (
                  <div className="absolute bottom-6 left-6 px-4 py-2 rounded-full gold-bg text-black text-[11px] font-black uppercase tracking-[0.18em] flex items-center gap-2">
                    <Star size={10} fill="black" /> Top Confort
                  </div>
                )}
              </div>

              <div className="p-6 md:p-10 space-y-6 md:space-y-10 flex-1 flex flex-col">
                <div className="space-y-3">
                  <h4 className="text-2xl font-display font-bold">{product.name}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed font-light">{product.description}</p>
                </div>

                <ul className="space-y-4 flex-1">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <Check size={12} strokeWidth={4} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {SITE.offer.includesInstallation && (
                  <div className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.18em] text-gray-200">
                    <Wrench className="w-4 h-4 text-cyan-300" /> Installation incluse (971)
                  </div>
                )}

                <button 
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('booking:setMode', { detail: { isPro: false } }));
                    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-5 rounded-2xl btn-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                >
                  Choisir ce Modèle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
