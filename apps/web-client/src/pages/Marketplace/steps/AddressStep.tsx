import React, { useState } from 'react';
import { ArrowLeft, MapPin, Navigation, Loader2 } from 'lucide-react';
import { useMarketplaceStore } from '../../../store/marketplace';

const AddressStep: React.FC = () => {
  const { addressStreet, addressCity, addressPostalCode, setAddress, setStep } = useMarketplaceStore();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();

  const canContinue = addressStreet.length > 0 && addressCity.length > 0 && addressPostalCode.length >= 5;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
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

  const handleContinue = () => {
    setAddress({
      street: addressStreet,
      city: addressCity,
      postalCode: addressPostalCode,
      lat,
      lng,
    });
    setStep('confirm');
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setStep('photos')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div>
        <h2 className="text-xl font-bold mb-1">Adresse d'intervention</h2>
        <p className="text-gray-400 text-sm">Où se situe le besoin ?</p>
      </div>

      {/* Geolocation */}
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

      {locationError && <p className="text-red-400 text-sm text-center">{locationError}</p>}
      {lat && lng && <p className="text-emerald-400 text-sm text-center">Position détectée</p>}

      <div className="relative">
        <p className="text-center text-gray-500 text-sm">ou saisir manuellement</p>
      </div>

      {/* Address fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Numéro et rue"
              value={addressStreet}
              onChange={(e) => setAddress({ street: e.target.value, city: addressCity, postalCode: addressPostalCode, lat, lng })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Code postal</label>
            <input
              type="text"
              placeholder="97100"
              value={addressPostalCode}
              onChange={(e) => setAddress({ street: addressStreet, city: addressCity, postalCode: e.target.value, lat, lng })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
            <input
              type="text"
              placeholder="Basse-Terre"
              value={addressCity}
              onChange={(e) => setAddress({ street: addressStreet, city: e.target.value, postalCode: addressPostalCode, lat, lng })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Continuer
      </button>
    </div>
  );
};

export default AddressStep;
