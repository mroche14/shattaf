import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useBookingStore } from '../../../store/booking';

interface LocationStepProps {
  onValidChange: (valid: boolean) => void;
}

const LocationStep: React.FC<LocationStepProps> = ({ onValidChange }) => {
  const store = useBookingStore();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Check validity
  useEffect(() => {
    const isValid =
      store.addressStreet.length > 0 &&
      store.addressCity.length > 0 &&
      store.addressPostalCode.length > 0 &&
      store.addressPostalCode.startsWith('971');

    onValidChange(isValid);
  }, [store.addressStreet, store.addressCity, store.addressPostalCode, onValidChange]);

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('La géolocalisation n\'est pas supportée');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        store.setLocation({
          addressLat: latitude,
          addressLng: longitude,
        });

        // In production, reverse geocode to get address
        // For now, just set coords
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Accès à la localisation refusé');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Position non disponible');
            break;
          default:
            setLocationError('Erreur de géolocalisation');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Geolocation button */}
      <button
        onClick={handleGetLocation}
        disabled={isLocating}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-cyan-500/20 border border-cyan-400/20 text-cyan-300 font-bold hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Navigation className="w-5 h-5" />
        )}
        Utiliser ma position
      </button>

      {locationError && (
        <p className="text-red-400 text-sm text-center">{locationError}</p>
      )}

      {store.addressLat && store.addressLng && (
        <p className="text-emerald-400 text-sm text-center">
          Position détectée
        </p>
      )}

      <div className="relative">
        <p className="text-center text-gray-500 text-sm">ou</p>
      </div>

      {/* Address form */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Adresse
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Numéro et rue"
            value={store.addressStreet}
            onChange={(e) => store.setLocation({ addressStreet: e.target.value })}
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Code postal
          </label>
          <input
            type="text"
            placeholder="97100"
            value={store.addressPostalCode}
            onChange={(e) => store.setLocation({ addressPostalCode: e.target.value })}
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          {store.addressPostalCode && !store.addressPostalCode.startsWith('971') && (
            <p className="text-amber-400 text-xs mt-1">Zone 971 uniquement</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ville
          </label>
          <input
            type="text"
            placeholder="Basse-Terre"
            value={store.addressCity}
            onChange={(e) => store.setLocation({ addressCity: e.target.value })}
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      {/* Access info */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <h3 className="font-medium mb-4">Informations d'accès (optionnel)</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Étage</label>
            <input
              type="number"
              placeholder="RDC = 0"
              value={store.floor ?? ''}
              onChange={(e) =>
                store.setLocation({ floor: e.target.value ? parseInt(e.target.value) : null })
              }
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Digicode</label>
            <input
              type="text"
              placeholder="A123B"
              value={store.digicode}
              onChange={(e) => store.setLocation({ digicode: e.target.value })}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="parking"
            checked={store.parkingAvailable}
            onChange={(e) => store.setLocation({ parkingAvailable: e.target.checked })}
            className="w-5 h-5 rounded bg-slate-800 border-white/10"
          />
          <label htmlFor="parking" className="text-sm text-gray-300">
            Parking disponible
          </label>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Notes d'accès
          </label>
          <textarea
            placeholder="Ex: Sonner au nom DUPONT"
            value={store.accessNotes}
            onChange={(e) => store.setLocation({ accessNotes: e.target.value })}
            rows={2}
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default LocationStep;
