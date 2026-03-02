import React from 'react';
import { Wrench, Droplets, Flame, ShowerHead, PipetteIcon } from 'lucide-react';
import { useMarketplaceStore } from '../../../store/marketplace';

const categories = [
  { id: 'plomberie_generale', label: 'Plomberie générale', icon: Wrench },
  { id: 'fuite', label: 'Réparation de fuite', icon: Droplets },
  { id: 'installation', label: 'Installation sanitaire', icon: ShowerHead },
  { id: 'chauffe_eau', label: 'Chauffe-eau', icon: Flame },
  { id: 'debouchage', label: 'Débouchage', icon: PipetteIcon },
];

const CategoryStep: React.FC = () => {
  const { category, description, setCategory, setDescription, setStep } = useMarketplaceStore();

  const canContinue = category && description.length >= 10;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Quel type de travaux ?</h2>
        <p className="text-gray-400 text-sm">Sélectionnez une catégorie et décrivez votre besoin.</p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              category === cat.id
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <cat.icon className={`w-6 h-6 ${category === cat.id ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span className="text-sm font-medium">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Décrivez votre besoin</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Ex: Ma chasse d'eau fuit depuis 2 jours, j'ai essayé de resserrer les joints mais ça continue..."
          className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/500 caractères (min. 10)</p>
      </div>

      <button
        onClick={() => setStep('photos')}
        disabled={!canContinue}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Continuer
      </button>
    </div>
  );
};

export default CategoryStep;
