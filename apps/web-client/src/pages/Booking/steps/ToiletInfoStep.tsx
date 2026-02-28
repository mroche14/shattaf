import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { useBookingStore } from '../../../store/booking';

interface ToiletInfoStepProps {
  onValidChange: (valid: boolean) => void;
}

const ToiletInfoStep: React.FC<ToiletInfoStepProps> = ({ onValidChange }) => {
  const store = useBookingStore();

  // Always valid for this step
  useEffect(() => {
    onValidChange(true);
  }, [onValidChange]);

  return (
    <div className="space-y-6">
      {/* Toilet type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Type de WC
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => store.setToiletInfo({ toiletType: 'standard' })}
            className={`p-4 rounded-xl border-2 transition-colors ${
              store.toiletType === 'standard'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Standard</span>
              {store.toiletType === 'standard' && (
                <Check className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <p className="text-sm text-gray-400 text-left">Posé au sol</p>
          </button>

          <button
            onClick={() => store.setToiletInfo({ toiletType: 'wall_hung' })}
            className={`p-4 rounded-xl border-2 transition-colors ${
              store.toiletType === 'wall_hung'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Suspendu</span>
              {store.toiletType === 'wall_hung' && (
                <Check className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <p className="text-sm text-gray-400 text-left">Fixé au mur (encastré)</p>
          </button>
        </div>
      </div>

      {/* Shutoff valve */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Robinet d'arrêt accessible ?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => store.setToiletInfo({ shutoffValveAccessible: true })}
            className={`p-4 rounded-xl border-2 transition-colors ${
              store.shutoffValveAccessible
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">Oui</span>
              {store.shutoffValveAccessible && (
                <Check className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <p className="text-sm text-gray-400 text-left mt-1">
              Visible et manoeuvrable
            </p>
          </button>

          <button
            onClick={() => store.setToiletInfo({ shutoffValveAccessible: false })}
            className={`p-4 rounded-xl border-2 transition-colors ${
              !store.shutoffValveAccessible
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">Non / Incertain</span>
              {!store.shutoffValveAccessible && (
                <Check className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <p className="text-sm text-gray-400 text-left mt-1">
              Caché ou difficile d'accès
            </p>
          </button>
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes supplémentaires (optionnel)
        </label>
        <textarea
          placeholder="Ex: Carrelage fragile, espace restreint..."
          value={store.additionalNotes}
          onChange={(e) => store.setToiletInfo({ additionalNotes: e.target.value })}
          rows={3}
          className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
        />
      </div>
    </div>
  );
};

export default ToiletInfoStep;
