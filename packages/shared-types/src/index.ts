/**
 * Shared TypeScript types for Shattaf Marketplace
 */

// User types
export type UserRole = 'customer' | 'plumber' | 'admin';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  avatarUrl?: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry: string;
  addressLat?: number;
  addressLng?: number;
  floor?: number;
  digicode?: string;
  accessNotes?: string;
}

export type PlumberStatus = 'pending' | 'active' | 'suspended' | 'inactive';

export interface PlumberProfile {
  id: string;
  userId: string;
  status: PlumberStatus;
  companyName?: string;
  siren?: string;
  siret?: string;
  stripeOnboardingComplete: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  totalJobsCompleted: number;
  averageRating?: number;
  totalRatings: number;
  mandateSigned: boolean;
}

// Product types
export type ProductCategory = 'shattaf' | 'kit' | 'accessory';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  priceB2c: number;
  priceB2b?: number;
  vatRate: number;
  stockQuantity: number;
  isAvailable: boolean;
  imageUrl?: string;
  galleryUrls?: string[];
  specifications?: Record<string, unknown>;
  requiresInstallation: boolean;
  installationTimeMinutes: number;
}

// Booking types
export type BookingStatus = 'draft' | 'submitted' | 'quoted' | 'accepted' | 'expired';
export type ToiletType = 'standard' | 'wall_hung';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface Booking {
  id: string;
  customerId: string;
  status: BookingStatus;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
  addressLat?: number;
  addressLng?: number;
  floor?: number;
  digicode?: string;
  parkingAvailable: boolean;
  accessNotes?: string;
  toiletType: ToiletType;
  shutoffValveAccessible: boolean;
  additionalNotes?: string;
  photoToiletFrontUrl?: string;
  photoToiletSideUrl?: string;
  photoValveUrl?: string;
  additionalPhotoUrls?: string[];
  productId?: string;
  preferredDate?: string;
  preferredTimeSlot?: TimeSlot;
  assignedPlumberId?: string;
  matchedAt?: string;
  createdAt: string;
}

// Quote types
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface Quote {
  id: string;
  bookingId: string;
  plumberId: string;
  status: QuoteStatus;
  installationPrice: number;
  productPrice: number;
  platformFee: number;
  totalPrice: number;
  vatAmount: number;
  priceExcludingVat: number;
  proposedDate: string;
  proposedTimeSlot: TimeSlot;
  estimatedDurationMinutes: number;
  validUntil: string;
  plumberNotes?: string;
  customerNotes?: string;
  createdAt: string;
}

// Order types
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  plumberId: string;
  bookingId: string;
  quoteId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  productSubtotal: number;
  installationSubtotal: number;
  platformFee: number;
  vatAmount: number;
  totalAmount: number;
  scheduledDate: string;
  scheduledTimeSlot: TimeSlot;
  actualStartTime?: string;
  actualEndTime?: string;
  completedAt?: string;
  customerRating?: number;
  customerReview?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  isInstallation: boolean;
}

// Job types
export type JobStatus =
  | 'scheduled'
  | 'en_route'
  | 'checked_in'
  | 'in_progress'
  | 'pending_signature'
  | 'completed'
  | 'cancelled';

export type PhotoType = 'before' | 'during' | 'after' | 'issue';

export interface Job {
  id: string;
  orderId: string;
  plumberId: string;
  status: JobStatus;
  checkinTime?: string;
  checkinLat?: number;
  checkinLng?: number;
  checkinDistanceMeters?: number;
  workStartedAt?: string;
  workCompletedAt?: string;
  signatureImageUrl?: string;
  signatureName: string;
  signatureTimestamp?: string;
  completedAt?: string;
  plumberNotes?: string;
  issuesReported?: string;
  createdAt: string;
}

export interface JobPhoto {
  id: string;
  photoUrl: string;
  photoType: PhotoType;
  caption?: string;
  lat?: number;
  lng?: number;
  takenAt: string;
}

// Invoice types
export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  status: InvoiceStatus;
  issuerName: string;
  issuerSiren: string;
  issuerAddress: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  plumberId: string;
  plumberName: string;
  plumberSiren: string;
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  subtotalProducts: number;
  subtotalInstallation: number;
  vatProducts: number;
  vatInstallation: number;
  totalExcludingVat: number;
  totalVat: number;
  totalAmount: number;
  vatRate: string;
  mandateMention: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  section: 'A' | 'B';
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: string;
  vatAmount: number;
  totalAmount: number;
  plumberSiren?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  isPlumber?: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

// API Response types
export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Utility types
export type Nullable<T> = T | null;

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2) + ' €';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTimeSlot(slot: TimeSlot): string {
  const slots: Record<TimeSlot, string> = {
    morning: 'Matin (8h-12h)',
    afternoon: 'Après-midi (14h-18h)',
    evening: 'Soir (18h-20h)',
  };
  return slots[slot];
}
