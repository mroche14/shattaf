import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building, FileText, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { useOnboardingStore, type OnboardingStep } from '../../store/onboarding';
import BusinessInfoStep from './steps/BusinessInfoStep';
import DocumentsStep from './steps/DocumentsStep';
import InterventionZonesStep from './steps/InterventionZonesStep';
import StripeConnectStep from './steps/StripeConnectStep';

const steps: { id: OnboardingStep; label: string; icon: React.ReactNode }[] = [
  { id: 'business', label: 'Entreprise', icon: <Building className="w-4 h-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  { id: 'zones', label: 'Zone', icon: <MapPin className="w-4 h-4" /> },
  { id: 'stripe', label: 'Paiements', icon: <CreditCard className="w-4 h-4" /> },
];

const OnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentStep, setStep, businessComplete, documentsComplete, zonesComplete, stripeComplete } = useOnboardingStore();

  // Handle Stripe redirect: force stripe step when returning from Stripe
  const stripeStep = searchParams.get('step');
  React.useEffect(() => {
    if (stripeStep === 'stripe') {
      setStep('stripe');
    }
  }, [stripeStep, setStep]);

  const completionMap: Record<OnboardingStep, boolean> = {
    business: businessComplete,
    documents: documentsComplete,
    zones: zonesComplete,
    stripe: stripeComplete,
  };

  const StepComponent = {
    business: BusinessInfoStep,
    documents: DocumentsStep,
    zones: InterventionZonesStep,
    stripe: StripeConnectStep,
  }[currentStep];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">
            Bienvenue sur Réseau Plomb
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Complétez votre profil pour recevoir des missions
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = completionMap[step.id];

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setStep(step.id)}
                  className={`flex flex-col items-center gap-1 transition-colors ${
                    isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : ''
                  }`}
                  style={!isActive && !isCompleted ? { color: 'var(--text-tertiary)' } : undefined}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 ring-2 ring-cyan-400'
                        : isCompleted
                        ? 'bg-emerald-500/20'
                        : ''
                    }`}
                    style={!isActive && !isCompleted ? { background: 'var(--bg-inner)' } : undefined}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.icon}
                  </div>
                  <span className="text-xs font-medium">{step.label}</span>
                </button>

                {index < steps.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2"
                    style={{
                      background: completionMap[steps[index].id]
                        ? 'rgb(52, 211, 153)'
                        : 'var(--border-color)',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step content */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <StepComponent />
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
