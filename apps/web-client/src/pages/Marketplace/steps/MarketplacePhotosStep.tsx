import React from 'react';
import { Camera, X, ArrowLeft } from 'lucide-react';
import { useMarketplaceStore } from '../../../store/marketplace';

const MarketplacePhotosStep: React.FC = () => {
  const { photos, addPhoto, removePhoto, setStep } = useMarketplaceStore();

  const handleAddPhoto = () => {
    // Placeholder — in production, this would open file picker and upload to S3
    addPhoto(`https://placehold.co/400x400/334155/94a3b8?text=Photo+${photos.length + 1}`);
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setStep('category')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div>
        <h2 className="text-xl font-bold mb-1">Photos (optionnel)</h2>
        <p className="text-gray-400 text-sm">
          Ajoutez des photos pour aider le plombier à évaluer les travaux.
        </p>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
            <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}

        {photos.length < 6 && (
          <button
            onClick={handleAddPhoto}
            className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-cyan-400/50 transition-colors"
          >
            <Camera className="w-6 h-6 text-gray-500" />
            <span className="text-xs text-gray-500">Ajouter</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setStep('address')}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all"
        >
          Continuer
        </button>
        <button
          onClick={() => setStep('address')}
          className="w-full py-2 text-gray-400 text-sm"
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
};

export default MarketplacePhotosStep;
