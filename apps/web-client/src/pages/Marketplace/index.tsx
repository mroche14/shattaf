import React from 'react';
import { useMarketplaceStore } from '../../store/marketplace';
import CategoryStep from './steps/CategoryStep';
import MarketplacePhotosStep from './steps/MarketplacePhotosStep';
import AddressStep from './steps/AddressStep';
import UrgencyStep from './steps/UrgencyStep';

const stepOrder = ['category', 'photos', 'address', 'confirm'] as const;

const MarketplacePage: React.FC = () => {
  const step = useMarketplaceStore((s) => s.step);
  const currentIndex = stepOrder.indexOf(step);

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {stepOrder.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? 'bg-cyan-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      {step === 'category' && <CategoryStep />}
      {step === 'photos' && <MarketplacePhotosStep />}
      {step === 'address' && <AddressStep />}
      {step === 'confirm' && <UrgencyStep />}
    </div>
  );
};

export default MarketplacePage;
