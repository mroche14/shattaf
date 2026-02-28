import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, Settings, Calendar, Loader2, CheckCircle } from 'lucide-react';
import { useBookingStore } from '../../store/booking';
import { useCreateBooking, useSubmitBooking, usePhotoUploadUrl } from '../../api/hooks/useBookings';

const BookingConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const store = useBookingStore();
  const createBooking = useCreateBooking();
  const submitBooking = useSubmitBooking();
  const getUploadUrl = usePhotoUploadUrl();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      // 1. Create booking
      const booking = await createBooking.mutateAsync({
        addressStreet: store.addressStreet,
        addressCity: store.addressCity,
        addressPostalCode: store.addressPostalCode,
        addressLat: store.addressLat ?? undefined,
        addressLng: store.addressLng ?? undefined,
        floor: store.floor ?? undefined,
        digicode: store.digicode || undefined,
        parkingAvailable: store.parkingAvailable,
        accessNotes: store.accessNotes || undefined,
        toiletType: store.toiletType,
        shutoffValveAccessible: store.shutoffValveAccessible,
        additionalNotes: store.additionalNotes || undefined,
        productId: store.productId ?? undefined,
        preferredDate: store.preferredDate ?? undefined,
        preferredTimeSlot: store.preferredTimeSlot ?? undefined,
      });

      // 2. Upload photos
      if (store.photoToiletFront) {
        const { upload_url } = await getUploadUrl.mutateAsync({
          bookingId: booking.id,
          photoType: 'toilet_front',
        });
        await fetch(upload_url, {
          method: 'PUT',
          body: store.photoToiletFront,
          headers: { 'Content-Type': 'image/jpeg' },
        });
      }

      if (store.photoToiletSide) {
        const { upload_url } = await getUploadUrl.mutateAsync({
          bookingId: booking.id,
          photoType: 'toilet_side',
        });
        await fetch(upload_url, {
          method: 'PUT',
          body: store.photoToiletSide,
          headers: { 'Content-Type': 'image/jpeg' },
        });
      }

      // 3. Submit booking
      await submitBooking.mutateAsync(booking.id);

      // 4. Reset store and show success
      store.reset();
      setIsSuccess(true);

      // Redirect after delay
      setTimeout(() => {
        navigate('/account/bookings');
      }, 3000);
    } catch (error) {
      console.error('Booking submission failed:', error);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="glass rounded-2xl p-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-4">
            Demande envoyée !
          </h1>
          <p className="text-gray-400 mb-6">
            Un plombier partenaire vous enverra un devis sous 24h.
          </p>
          <p className="text-sm text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">
        Récapitulatif
      </h1>

      {/* Location */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Adresse</h3>
            <p className="text-gray-400 text-sm">
              {store.addressStreet}
              <br />
              {store.addressPostalCode} {store.addressCity}
            </p>
            {store.floor !== null && (
              <p className="text-gray-500 text-sm mt-1">
                Étage {store.floor}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <Camera className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium mb-2">Photos</h3>
            <div className="grid grid-cols-2 gap-2">
              {store.photoToiletFrontUrl && (
                <img
                  src={store.photoToiletFrontUrl}
                  alt="Face WC"
                  className="aspect-video object-cover rounded-lg"
                />
              )}
              {store.photoToiletSideUrl && (
                <img
                  src={store.photoToiletSideUrl}
                  alt="Côté WC"
                  className="aspect-video object-cover rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toilet info */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Configuration</h3>
            <p className="text-gray-400 text-sm">
              WC {store.toiletType === 'standard' ? 'standard' : 'suspendu'}
              <br />
              Robinet d'arrêt{' '}
              {store.shutoffValveAccessible ? 'accessible' : 'non accessible'}
            </p>
          </div>
        </div>
      </div>

      {/* Schedule */}
      {(store.preferredDate || store.preferredTimeSlot) && (
        <div className="glass rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Préférence horaire</h3>
              <p className="text-gray-400 text-sm">
                {store.preferredDate &&
                  new Date(store.preferredDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                {store.preferredTimeSlot && (
                  <>
                    <br />
                    {store.preferredTimeSlot === 'morning' && 'Matin (8h-12h)'}
                    {store.preferredTimeSlot === 'afternoon' && 'Après-midi (14h-18h)'}
                    {store.preferredTimeSlot === 'evening' && 'Soir (18h-20h)'}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          'Confirmer la demande'
        )}
      </button>

      <p className="text-center text-gray-500 text-sm mt-4">
        Un plombier vous enverra un devis personnalisé
      </p>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default BookingConfirmPage;
