import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useBookingStore } from '../../store/booking';
import LocationStep from './steps/LocationStep';
import PhotosStep from './steps/PhotosStep';
import ToiletInfoStep from './steps/ToiletInfoStep';
import ScheduleStep from './steps/ScheduleStep';

const steps = [
  { id: 1, title: 'Localisation' },
  { id: 2, title: 'Photos' },
  { id: 3, title: 'Informations' },
  { id: 4, title: 'Planification' },
];

const BookingStepsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentStep = useBookingStore((state) => state.currentStep);
  const setStep = useBookingStore((state) => state.setStep);
  const [isValid, setIsValid] = useState(false);

  const handleNext = () => {
    if (currentStep < 4) {
      setStep(currentStep + 1);
    } else {
      navigate('/booking/confirm');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step.id < currentStep
                    ? 'bg-emerald-500 text-white'
                    : step.id === currentStep
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-slate-800 text-gray-500'
                }`}
              >
                {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className="text-xs text-gray-500 mt-1 hidden sm:block">
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl font-bold mb-6">
          {steps[currentStep - 1].title}
        </h2>

        {currentStep === 1 && <LocationStep onValidChange={setIsValid} />}
        {currentStep === 2 && <PhotosStep onValidChange={setIsValid} />}
        {currentStep === 3 && <ToiletInfoStep onValidChange={setIsValid} />}
        {currentStep === 4 && <ScheduleStep onValidChange={setIsValid} />}
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-slate-800/50 border border-white/10 text-white font-bold uppercase tracking-wider hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl btn-primary text-white font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 4 ? 'Confirmer' : 'Suivant'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:hidden" />
    </div>
  );
};

export default BookingStepsPage;
