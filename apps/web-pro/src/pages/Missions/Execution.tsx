import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Camera, CheckCircle, Pen, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

type ExecutionStep = 'checkin' | 'photos_before' | 'working' | 'photos_after' | 'signature' | 'complete';

const JobExecutionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<ExecutionStep>('checkin');
  const [isLocating, setIsLocating] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => apiClient.jobs.get(id!),
    enabled: !!id,
  });

  const checkinMutation = useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) =>
      apiClient.jobs.checkin(id!, lat, lng),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      setCurrentStep('photos_before');
    },
  });

  const startWorkMutation = useMutation({
    mutationFn: () => apiClient.jobs.start(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      setCurrentStep('working');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => apiClient.jobs.complete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate('/missions');
    },
  });

  const handleCheckin = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        checkinMutation.mutate({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (error) => {
        alert('Erreur de géolocalisation');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleStartWork = () => {
    startWorkMutation.mutate();
  };

  const handleComplete = () => {
    completeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-xl font-bold mb-4">Mission non trouvée</h1>
        <Link to="/missions" className="text-cyan-400">
          Retour aux missions
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to={`/missions/${id}`}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-xl font-bold">Exécution mission</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {['checkin', 'photos_before', 'working', 'photos_after', 'signature'].map(
          (step, index) => (
            <React.Fragment key={step}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                  currentStep === step
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : index <
                      ['checkin', 'photos_before', 'working', 'photos_after', 'signature'].indexOf(
                        currentStep
                      )
                    ? 'bg-emerald-500 text-white'
                    : ''
                }`}
                style={
                  currentStep !== step &&
                  index >=
                    ['checkin', 'photos_before', 'working', 'photos_after', 'signature'].indexOf(
                      currentStep
                    )
                    ? { background: 'var(--bg-inner)', color: 'var(--text-tertiary)' }
                    : undefined
                }
              >
                {index + 1}
              </div>
              {index < 4 && (
                <div
                  className={`flex-1 h-1 mx-1 rounded ${
                    index <
                    ['checkin', 'photos_before', 'working', 'photos_after', 'signature'].indexOf(
                      currentStep
                    )
                      ? 'bg-emerald-500'
                      : ''
                  }`}
                  style={
                    index >=
                    ['checkin', 'photos_before', 'working', 'photos_after', 'signature'].indexOf(
                      currentStep
                    )
                      ? { background: 'var(--bg-inner)' }
                      : undefined
                  }
                />
              )}
            </React.Fragment>
          )
        )}
      </div>

      {/* Step content */}
      <div className="flex-1">
        {/* Check-in step */}
        {currentStep === 'checkin' && (
          <div className="glass rounded-2xl p-6 text-center transition-colors duration-200">
            <MapPin className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="font-bold text-xl mb-2">Pointer votre arrivée</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
              Confirmez votre présence sur le lieu d'intervention
            </p>
            <button
              onClick={handleCheckin}
              disabled={isLocating || checkinMutation.isPending}
              className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLocating || checkinMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  Je suis arrivé
                </>
              )}
            </button>
          </div>
        )}

        {/* Photos before step */}
        {currentStep === 'photos_before' && (
          <div className="glass rounded-2xl p-6 transition-colors duration-200">
            <Camera className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="font-bold text-xl mb-2 text-center">Photos avant</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="text-center mb-6">
              Prenez des photos de l'installation existante
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <label className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors duration-200" style={{ borderColor: 'var(--border-color)' }}>
                <Camera className="w-8 h-8 mb-2" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Photo 1</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" />
              </label>
              <label className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors duration-200" style={{ borderColor: 'var(--border-color)' }}>
                <Camera className="w-8 h-8 mb-2" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Photo 2</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" />
              </label>
            </div>

            <button
              onClick={handleStartWork}
              disabled={startWorkMutation.isPending}
              className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {startWorkMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Commencer le travail'
              )}
            </button>
          </div>
        )}

        {/* Working step */}
        {currentStep === 'working' && (
          <div className="glass rounded-2xl p-6 text-center transition-colors duration-200">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-cyan-500" />
            </div>
            <h2 className="font-bold text-xl mb-2">Travail en cours</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
              Effectuez l'installation du shattaf
            </p>
            <button
              onClick={() => setCurrentStep('photos_after')}
              className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider"
            >
              Travail terminé
            </button>
          </div>
        )}

        {/* Photos after step */}
        {currentStep === 'photos_after' && (
          <div className="glass rounded-2xl p-6 transition-colors duration-200">
            <Camera className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-bold text-xl mb-2 text-center">Photos après</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="text-center mb-6">
              Prenez des photos de l'installation terminée
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <label className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors duration-200" style={{ borderColor: 'var(--border-color)' }}>
                <Camera className="w-8 h-8 mb-2" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Photo 1</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" />
              </label>
              <label className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors duration-200" style={{ borderColor: 'var(--border-color)' }}>
                <Camera className="w-8 h-8 mb-2" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Photo 2</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" />
              </label>
            </div>

            <button
              onClick={() => setCurrentStep('signature')}
              className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider"
            >
              Passer à la signature
            </button>
          </div>
        )}

        {/* Signature step */}
        {currentStep === 'signature' && (
          <div className="glass rounded-2xl p-6 transition-colors duration-200">
            <Pen className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="font-bold text-xl mb-2 text-center">Signature client</h2>
            <p style={{ color: 'var(--text-secondary)' }} className="text-center mb-6">
              Le client confirme la bonne réalisation
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Nom du signataire
              </label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Prénom Nom"
                className="w-full rounded-xl px-4 py-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Signature
              </label>
              <canvas
                ref={canvasRef}
                className="w-full h-40 bg-white rounded-xl"
              />
              <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-tertiary)' }}>
                Dessinez la signature avec le doigt
              </p>
            </div>

            <button
              onClick={handleComplete}
              disabled={!signatureName || completeMutation.isPending}
              className="w-full btn-primary py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Terminer la mission
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobExecutionPage;
