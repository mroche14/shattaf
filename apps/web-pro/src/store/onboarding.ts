/**
 * Onboarding flow state management.
 */
import { create } from 'zustand';

export type OnboardingStep = 'business' | 'documents' | 'zones' | 'stripe';

interface OnboardingState {
  currentStep: OnboardingStep;
  businessComplete: boolean;
  documentsComplete: boolean;
  zonesComplete: boolean;
  stripeComplete: boolean;
  setStep: (step: OnboardingStep) => void;
  markComplete: (step: OnboardingStep) => void;
  completionPercent: () => number;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 'business',
  businessComplete: false,
  documentsComplete: false,
  zonesComplete: false,
  stripeComplete: false,

  setStep: (step) => set({ currentStep: step }),

  markComplete: (step) => {
    switch (step) {
      case 'business':
        set({ businessComplete: true });
        break;
      case 'documents':
        set({ documentsComplete: true });
        break;
      case 'zones':
        set({ zonesComplete: true });
        break;
      case 'stripe':
        set({ stripeComplete: true });
        break;
    }
  },

  completionPercent: () => {
    const state = get();
    let count = 0;
    if (state.businessComplete) count++;
    if (state.documentsComplete) count++;
    if (state.zonesComplete) count++;
    if (state.stripeComplete) count++;
    return Math.round((count / 4) * 100);
  },
}));
