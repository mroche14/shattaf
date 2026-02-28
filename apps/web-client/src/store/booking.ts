import { create } from 'zustand';
import type { ToiletType, TimeSlot } from '@shattaf/shared-types';

interface BookingState {
  // Step 1: Location
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressLat: number | null;
  addressLng: number | null;
  floor: number | null;
  digicode: string;
  parkingAvailable: boolean;
  accessNotes: string;

  // Step 2: Photos
  photoToiletFront: File | null;
  photoToiletSide: File | null;
  photoToiletFrontUrl: string | null;
  photoToiletSideUrl: string | null;

  // Step 3: Toilet info
  toiletType: ToiletType;
  shutoffValveAccessible: boolean;
  additionalNotes: string;

  // Step 4: Product & Schedule
  productId: string | null;
  preferredDate: string | null;
  preferredTimeSlot: TimeSlot | null;

  // Current step
  currentStep: number;

  // Actions
  setLocation: (data: Partial<BookingState>) => void;
  setPhotos: (data: Partial<BookingState>) => void;
  setToiletInfo: (data: Partial<BookingState>) => void;
  setSchedule: (data: Partial<BookingState>) => void;
  setStep: (step: number) => void;
  reset: () => void;
}

const initialState = {
  addressStreet: '',
  addressCity: '',
  addressPostalCode: '',
  addressLat: null,
  addressLng: null,
  floor: null,
  digicode: '',
  parkingAvailable: false,
  accessNotes: '',
  photoToiletFront: null,
  photoToiletSide: null,
  photoToiletFrontUrl: null,
  photoToiletSideUrl: null,
  toiletType: 'standard' as ToiletType,
  shutoffValveAccessible: true,
  additionalNotes: '',
  productId: null,
  preferredDate: null,
  preferredTimeSlot: null,
  currentStep: 1,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setLocation: (data) => set((state) => ({ ...state, ...data })),
  setPhotos: (data) => set((state) => ({ ...state, ...data })),
  setToiletInfo: (data) => set((state) => ({ ...state, ...data })),
  setSchedule: (data) => set((state) => ({ ...state, ...data })),
  setStep: (step) => set({ currentStep: step }),
  reset: () => set(initialState),
}));
