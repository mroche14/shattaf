import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useOnboardingStore } from '../../../store/onboarding';

const DocumentsStep: React.FC = () => {
  const { setStep, markComplete } = useOnboardingStore();
  const [insuranceUploaded, setInsuranceUploaded] = useState(false);
  const [qualificationUploaded, setQualificationUploaded] = useState(false);

  const handleInsuranceUpload = () => {
    // In production: upload to S3, get URL, update profile
    setInsuranceUploaded(true);
  };

  const handleQualificationUpload = () => {
    setQualificationUploaded(true);
  };

  const handleContinue = () => {
    markComplete('documents');
    setStep('zones');
  };

  const handleSkip = () => {
    setStep('zones');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Documents</h2>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
          Téléchargez vos documents professionnels. Vous pourrez les ajouter plus tard.
        </p>
      </div>

      <div className="space-y-4">
        {/* Insurance */}
        <div
          className="rounded-xl p-4 cursor-pointer transition-colors"
          style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)' }}
          onClick={handleInsuranceUpload}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
              {insuranceUploaded ? (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              ) : (
                <FileText className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Attestation d'assurance RC Pro</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {insuranceUploaded ? 'Document téléchargé' : 'PDF ou image, max 10 Mo'}
              </p>
            </div>
            {!insuranceUploaded && (
              <Upload className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            )}
          </div>
        </div>

        {/* Qualification */}
        <div
          className="rounded-xl p-4 cursor-pointer transition-colors"
          style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)' }}
          onClick={handleQualificationUpload}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
              {qualificationUploaded ? (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              ) : (
                <FileText className="w-6 h-6 text-cyan-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Qualification professionnelle</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {qualificationUploaded ? 'Document téléchargé' : 'Diplôme, attestation, ou 3 ans d\'expérience'}
              </p>
            </div>
            {!qualificationUploaded && (
              <Upload className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleContinue}
          className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          Continuer
        </button>
        <button
          onClick={handleSkip}
          className="w-full py-3 rounded-xl font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Ajouter plus tard
        </button>
      </div>
    </div>
  );
};

export default DocumentsStep;
