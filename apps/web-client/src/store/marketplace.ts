/**
 * Marketplace booking flow state.
 */
import { create } from 'zustand';

export type MarketplaceStep = 'category' | 'photos' | 'address' | 'confirm';

interface MarketplaceState {
  step: MarketplaceStep;
  category: string;
  description: string;
  photos: string[];
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressLat: number | null;
  addressLng: number | null;
  urgency: 'normal' | 'urgent' | 'flexible';

  setStep: (step: MarketplaceStep) => void;
  setCategory: (category: string) => void;
  setDescription: (description: string) => void;
  addPhoto: (url: string) => void;
  removePhoto: (index: number) => void;
  setAddress: (address: { street: string; city: string; postalCode: string; lat?: number; lng?: number }) => void;
  setUrgency: (urgency: 'normal' | 'urgent' | 'flexible') => void;
  reset: () => void;
}

const initialState = {
  step: 'category' as MarketplaceStep,
  category: '',
  description: '',
  photos: [] as string[],
  addressStreet: '',
  addressCity: '',
  addressPostalCode: '',
  addressLat: null as number | null,
  addressLng: null as number | null,
  urgency: 'normal' as const,
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setCategory: (category) => set({ category }),
  setDescription: (description) => set({ description }),
  addPhoto: (url) => set((s) => ({ photos: [...s.photos, url] })),
  removePhoto: (index) => set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
  setAddress: (address) =>
    set({
      addressStreet: address.street,
      addressCity: address.city,
      addressPostalCode: address.postalCode,
      addressLat: address.lat ?? null,
      addressLng: address.lng ?? null,
    }),
  setUrgency: (urgency) => set({ urgency }),
  reset: () => set(initialState),
}));
