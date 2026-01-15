
import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, CreditCard, Loader2, Minus, Plus, UserCheck } from 'lucide-react';
import { PRODUCTS } from '../constants';
import { SITE, formatWhatsAppLink, isTruthyString } from '../siteConfig';

const BookingSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    modelId: PRODUCTS[0].id,
    location: '',
    date: '',
    customerName: '',
    email: '',
    companyName: ''
  });

  const selectedProduct = PRODUCTS.find(p => p.id === formData.modelId) || PRODUCTS[0];
  const subtotal = selectedProduct.price * quantity;
  const hasDiscount = !isPro && quantity >= 3;
  const discountAmount = hasDiscount ? subtotal * 0.10 : 0;
  const total = subtotal - discountAmount;

  const applyMode = (nextIsPro: boolean) => {
    setIsPro(nextIsPro);
    if (!nextIsPro) {
      setQuantity((prev) => Math.min(prev, 5));
    }
  };

  useEffect(() => {
    const handler: EventListener = (event) => {
      const custom = event as CustomEvent<{ isPro?: boolean }>;
      if (typeof custom.detail?.isPro !== 'boolean') return;
      applyMode(custom.detail.isPro);
    };
    window.addEventListener('booking:setMode', handler);
    return () => window.removeEventListener('booking:setMode', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const lines = [
      isPro ? 'DEMANDE DEVIS PRO — Oasis Shattaf' : 'RÉSERVATION INSTALLATION — Oasis Shattaf',
      '',
      `Modèle : ${selectedProduct.name} (${selectedProduct.price}€)`,
      `Quantité : ${quantity}`,
      `Ville (971) : ${formData.location}`,
      formData.date ? `Date souhaitée : ${formData.date}` : null,
      isPro ? `Établissement : ${formData.companyName}` : null,
      `Nom : ${formData.customerName}`,
      formData.email ? `Email : ${formData.email}` : null,
      '',
      `Total estimé : ${total.toFixed(2)}€${hasDiscount ? ' (remise volume incluse)' : ''}`,
    ].filter(Boolean);

    const message = lines.join('\n');
    const whatsappHref = formatWhatsAppLink(SITE.contact.whatsappE164, message);
    const mailtoHref = isTruthyString(SITE.contact.email)
      ? `mailto:${SITE.contact.email}?subject=${encodeURIComponent(
          isPro ? 'Demande devis PRO — Oasis Shattaf' : 'Réservation installation — Oasis Shattaf'
        )}&body=${encodeURIComponent(message)}`
      : '';

    if (isTruthyString(whatsappHref)) {
      window.open(whatsappHref, '_blank', 'noopener,noreferrer');
      setLoading(false);
      setSuccess(true);
      return;
    }

    if (isTruthyString(mailtoHref)) {
      window.location.href = mailtoHref;
      setLoading(false);
      setSuccess(true);
      return;
    }

    setLoading(false);
    setSuccess(true);
  };

  const handleQtyChange = (val: number) => {
    const newQty = Math.max(1, Math.min(isPro ? 100 : 5, quantity + val));
    setQuantity(newQty);
  };

  if (success) {
    return (
      <section id="booking" className="py-32 flex items-center justify-center">
        <div className="glass p-16 rounded-[60px] text-center space-y-10 max-w-xl border-cyan-500/30 cyan-glow">
          <div className="w-24 h-24 btn-primary rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-black text-white">Demande prête</h2>
            <p className="text-gray-400 text-lg font-light leading-relaxed">
              Si WhatsApp ou votre email s'est ouvert, envoyez le message : nous vous répondons sous {SITE.offer.responseTime} pour confirmer le créneau et les modalités.
            </p>
          </div>
          <button onClick={() => setSuccess(false)} className="text-cyan-300 underline font-black tracking-[0.18em] uppercase text-[11px]">Faire une autre demande</button>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h2 className="text-cyan-400 text-xs font-black tracking-[0.4em] uppercase">Service & Réservation</h2>
            <h3 className="text-5xl md:text-8xl font-display font-black leading-none tracking-tighter">Votre Espace, <br/> <span className="cyan-gradient-text">Votre Hygiène.</span></h3>
            
            <div className="flex gap-2 p-1 glass rounded-2xl w-fit">
              <button 
                onClick={() => applyMode(false)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isPro ? 'btn-primary shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <UserCheck size={16} /> Particulier
              </button>
              <button 
                onClick={() => applyMode(true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isPro ? 'btn-primary shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <Building2 size={16} /> Professionnel
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-gray-400 text-xl font-light leading-relaxed">
                {isPro 
                  ? "Solutions de volume pour hôtels, villas de luxe et entreprises. Bénéficiez d'une logistique dédiée et d'un support prioritaire."
                  : "Améliorez votre quotidien. Nous installons chez vous en ~30 minutes, proprement et avec soin."
                }
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { title: '1) Choisissez', desc: 'Modèle & quantité' },
                  { title: `2) On confirme`, desc: `Sous ${SITE.offer.responseTime}` },
                  { title: '3) On installe', desc: '~30 minutes' },
                ].map((item) => (
                  <div key={item.title} className="p-5 rounded-3xl bg-white/5 border border-white/10">
                    <div className="text-white font-black text-xs uppercase tracking-[0.18em]">{item.title}</div>
                    <div className="text-gray-400 text-sm font-light mt-2">{item.desc}</div>
                  </div>
                ))}
              </div>
              {!isPro && (
                <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/20 flex items-center gap-6">
                  <div className="w-12 h-12 rounded-full gold-bg flex items-center justify-center text-black font-black">-10%</div>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">Offre Volume : -10% dès 3 unités installées</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass p-10 md:p-14 rounded-[60px] border-white/5 space-y-8 shadow-2xl relative">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.18em]">Modèle Oasis</label>
                <select 
                  className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-5 text-white font-bold focus:border-cyan-400 outline-none transition-all"
                  value={formData.modelId}
                  onChange={(e) => setFormData({...formData, modelId: e.target.value})}
                >
                  {PRODUCTS.map(p => <option key={p.id} value={p.id} className="bg-[#020617]">{p.name} — {p.price}€</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.18em]">Quantité</label>
                <div className="flex items-center gap-6 glass p-2 rounded-2xl w-fit">
                  <button type="button" onClick={() => handleQtyChange(-1)} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <Minus size={18} />
                  </button>
                  <span className="text-2xl font-black min-w-[40px] text-center">{quantity}</span>
                  <button type="button" onClick={() => handleQtyChange(1)} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <Plus size={18} />
                  </button>
                </div>
                {!isPro && quantity >= 5 && (
                  <p className="text-[11px] text-amber-300 font-black uppercase tracking-[0.18em]">
                    Limite particulier : 5 unités. Contactez-nous pour plus.
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.18em]">Ville (971)</label>
                <input required placeholder="ex: Gosier" className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-cyan-400 outline-none" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.18em]">Date souhaitée (optionnel)</label>
                <input type="date" className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-cyan-400 outline-none" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4">
              {isPro && (
                <input required placeholder="Nom de l'établissement / Hôtel" className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-cyan-400 outline-none" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
              )}
              <input required placeholder={isPro ? "Nom du responsable" : "Votre nom"} className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-cyan-400 outline-none" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />
              <input type="email" placeholder="Email (optionnel)" className="w-full bg-[#020617] border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-cyan-400 outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                <span>Sous-total</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              {hasDiscount && (
                <div className="flex justify-between items-center text-sm font-bold text-amber-400 uppercase tracking-widest">
                  <span>Remise Volume (10%)</span>
                  <span>-{discountAmount.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between items-center text-2xl font-black text-white uppercase tracking-tighter">
                <span>Total Estimé</span>
                <span className={hasDiscount ? 'gold-text' : 'cyan-gradient-text'}>{total.toFixed(2)}€</span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 rounded-2xl btn-primary text-white font-black text-lg flex items-center justify-center gap-5 uppercase tracking-[0.22em] shadow-xl hover:scale-[1.02] transition-all">
              {loading ? <Loader2 className="animate-spin" /> : <><CreditCard /> {isPro ? 'Demander un devis' : 'Envoyer ma demande'}</>}
            </button>
            <p className="text-center text-[11px] text-gray-400 font-black uppercase tracking-[0.18em]">
              Réponse sous {SITE.offer.responseTime} — {SITE.offer.includesInstallation ? 'installation incluse' : 'installation sur devis'} en Guadeloupe
            </p>
            <p className="text-center text-sm text-gray-500 font-light">
              Aucun paiement n'est effectué en ligne à cette étape : on confirme d'abord le créneau et les modalités.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
