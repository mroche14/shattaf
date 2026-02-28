import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useBookingStore } from '../../../store/booking';

interface PhotosStepProps {
  onValidChange: (valid: boolean) => void;
}

interface PhotoUploadProps {
  label: string;
  description: string;
  value: File | null;
  previewUrl: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  label,
  description,
  value,
  previewUrl,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Compress image
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      // Create preview URL
      const preview = URL.createObjectURL(compressed);
      onChange(compressed, preview);
    } catch (error) {
      console.error('Compression failed:', error);
      // Use original file if compression fails
      onChange(file, URL.createObjectURL(file));
    }

    setIsProcessing(false);
  };

  const handleRemove = () => {
    onChange(null, null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
        id={`photo-${label}`}
      />

      {previewUrl ? (
        <div className="relative aspect-video rounded-xl overflow-hidden">
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-sm font-medium">{label}</p>
          </div>
        </div>
      ) : (
        <label
          htmlFor={`photo-${label}`}
          className={`flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed ${
            isProcessing
              ? 'border-cyan-500/50 bg-cyan-500/10'
              : 'border-white/20 bg-slate-800/30 hover:border-cyan-500/50 hover:bg-cyan-500/10'
          } cursor-pointer transition-colors`}
        >
          {isProcessing ? (
            <div className="animate-pulse">
              <Camera className="w-10 h-10 text-cyan-400 mb-2" />
              <p className="text-sm text-gray-400">Traitement...</p>
            </div>
          ) : (
            <>
              <Camera className="w-10 h-10 text-gray-500 mb-2" />
              <p className="text-sm font-medium text-center">{label}</p>
              <p className="text-xs text-gray-500 text-center mt-1">{description}</p>
            </>
          )}
        </label>
      )}
    </div>
  );
};

const PhotosStep: React.FC<PhotosStepProps> = ({ onValidChange }) => {
  const store = useBookingStore();

  // Check validity (need at least 2 photos)
  useEffect(() => {
    const isValid = !!store.photoToiletFront && !!store.photoToiletSide;
    onValidChange(isValid);
  }, [store.photoToiletFront, store.photoToiletSide, onValidChange]);

  return (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200">
          <p className="font-medium mb-1">Photos requises</p>
          <p className="text-amber-300/80">
            Prenez 2 photos minimum pour que le plombier puisse établir un devis précis.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <PhotoUpload
          label="Face des WC"
          description="Vue de face complète"
          value={store.photoToiletFront}
          previewUrl={store.photoToiletFrontUrl}
          onChange={(file, url) =>
            store.setPhotos({
              photoToiletFront: file,
              photoToiletFrontUrl: url,
            })
          }
        />

        <PhotoUpload
          label="Côté robinet d'arrêt"
          description="Vue du côté avec le robinet"
          value={store.photoToiletSide}
          previewUrl={store.photoToiletSideUrl}
          onChange={(file, url) =>
            store.setPhotos({
              photoToiletSide: file,
              photoToiletSideUrl: url,
            })
          }
        />
      </div>

      <p className="text-center text-gray-500 text-sm">
        Photos compressées automatiquement pour un envoi rapide
      </p>
    </div>
  );
};

export default PhotosStep;
