/**
 * Shattaf API Client
 */

import type {
  User,
  CustomerProfile,
  PlumberProfile,
  Project,
  ProjectStats,
  Product,
  Booking,
  Quote,
  Order,
  OrderItem,
  Mission,
  MissionPhoto,
  Invoice,
  InvoiceItem,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
} from '@shattaf/shared-types';

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private getToken: () => string | null;
  private onUnauthorized: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getToken = config.getToken || (() => null);
    this.onUnauthorized = config.onUnauthorized || (() => {});
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { skipAuth?: boolean }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!options?.skipAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      this.onUnauthorized();
      throw new ApiError(401, 'Non autorisé');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur serveur' }));
      throw new ApiError(response.status, error.detail || 'Erreur serveur');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    login: (data: LoginRequest): Promise<TokenResponse> =>
      this.request('POST', '/auth/login', data, { skipAuth: true }),

    register: (data: RegisterRequest): Promise<User> =>
      this.request('POST', '/auth/register', data, { skipAuth: true }),

    refresh: (refreshToken: string): Promise<TokenResponse> =>
      this.request('POST', '/auth/refresh', { refresh_token: refreshToken }, { skipAuth: true }),

    me: (): Promise<User> => this.request('GET', '/auth/me'),
  };

  // User endpoints
  users = {
    updateMe: (data: Partial<User>): Promise<User> =>
      this.request('PATCH', '/users/me', data),

    getCustomerProfile: (): Promise<CustomerProfile> =>
      this.request('GET', '/users/me/customer-profile'),

    updateCustomerProfile: (data: Partial<CustomerProfile>): Promise<CustomerProfile> =>
      this.request('PATCH', '/users/me/customer-profile', data),

    getPlumberProfile: (): Promise<PlumberProfile> =>
      this.request('GET', '/users/me/plumber-profile'),

    updatePlumberProfile: (data: Partial<PlumberProfile>): Promise<PlumberProfile> =>
      this.request('PATCH', '/users/me/plumber-profile', data),
  };

  // Product endpoints
  products = {
    list: (params?: { category?: string; availableOnly?: boolean }): Promise<Product[]> => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.availableOnly !== undefined) searchParams.set('available_only', String(params.availableOnly));
      const query = searchParams.toString();
      return this.request('GET', `/products${query ? `?${query}` : ''}`);
    },

    get: (id: string): Promise<Product> =>
      this.request('GET', `/products/${id}`),

    create: (data: Partial<Product>): Promise<Product> =>
      this.request('POST', '/products', data),

    update: (id: string, data: Partial<Product>): Promise<Product> =>
      this.request('PATCH', `/products/${id}`, data),

    delete: (id: string): Promise<void> =>
      this.request('DELETE', `/products/${id}`),
  };

  // Booking endpoints
  bookings = {
    create: (data: Partial<Booking>): Promise<Booking> =>
      this.request('POST', '/bookings', data),

    list: (status?: string): Promise<Booking[]> => {
      const query = status ? `?status_filter=${status}` : '';
      return this.request('GET', `/bookings${query}`);
    },

    get: (id: string): Promise<Booking> =>
      this.request('GET', `/bookings/${id}`),

    update: (id: string, data: Partial<Booking>): Promise<Booking> =>
      this.request('PATCH', `/bookings/${id}`, data),

    getPhotoUploadUrl: (
      id: string,
      photoType: string
    ): Promise<{ upload_url: string; photo_url: string }> =>
      this.request('POST', `/bookings/${id}/photos/upload-url?photo_type=${photoType}`),

    submit: (id: string): Promise<Booking> =>
      this.request('POST', `/bookings/${id}/submit`),
  };

  // Quote endpoints
  quotes = {
    create: (data: {
      bookingId: string;
      installationPrice: number;
      proposedDate: string;
      proposedTimeSlot: string;
      estimatedDurationMinutes?: number;
      plumberNotes?: string;
    }): Promise<Quote> =>
      this.request('POST', '/quotes', {
        booking_id: data.bookingId,
        installation_price: data.installationPrice,
        proposed_date: data.proposedDate,
        proposed_time_slot: data.proposedTimeSlot,
        estimated_duration_minutes: data.estimatedDurationMinutes,
        plumber_notes: data.plumberNotes,
      }),

    listByPlumber: (status?: string): Promise<Quote[]> => {
      const query = status ? `?status_filter=${status}` : '';
      return this.request('GET', `/quotes/plumber${query}`);
    },

    listByBooking: (bookingId: string): Promise<Quote[]> =>
      this.request('GET', `/quotes/booking/${bookingId}`),

    get: (id: string): Promise<Quote> =>
      this.request('GET', `/quotes/${id}`),

    accept: (id: string, notes?: string): Promise<Quote> =>
      this.request('POST', `/quotes/${id}/accept`, { customer_notes: notes }),

    reject: (id: string): Promise<Quote> =>
      this.request('POST', `/quotes/${id}/reject`),

    generateAI: (bookingId: string, plumberNotes?: string): Promise<{
      line_items: Array<{
        description: string;
        quantity: number;
        unit_price_cents: number;
        item_type: string;
      }>;
      subtotal_cents: number;
      vat_amount_cents: number;
      total_cents: number;
      vat_rate: number;
      estimated_duration_minutes: number;
      confidence: number;
      reasoning: string;
    }> =>
      this.request('POST', '/quotes/ai-draft', {
        booking_id: bookingId,
        plumber_notes: plumberNotes,
      }),
  };

  // Order endpoints
  orders = {
    createFromQuote: (quoteId: string): Promise<Order> =>
      this.request('POST', `/orders/from-quote/${quoteId}`),

    list: (status?: string): Promise<Order[]> => {
      const query = status ? `?status_filter=${status}` : '';
      return this.request('GET', `/orders${query}`);
    },

    get: (id: string): Promise<Order> =>
      this.request('GET', `/orders/${id}`),

    getItems: (id: string): Promise<OrderItem[]> =>
      this.request('GET', `/orders/${id}/items`),

    rate: (id: string, rating: number, review?: string): Promise<void> =>
      this.request('POST', `/orders/${id}/rate?rating=${rating}${review ? `&review=${encodeURIComponent(review)}` : ''}`),
  };

  // Mission endpoints
  missions = {
    list: (status?: string): Promise<Mission[]> => {
      const query = status ? `?status_filter=${status}` : '';
      return this.request('GET', `/missions${query}`);
    },

    listToday: (): Promise<Mission[]> =>
      this.request('GET', '/missions/today'),

    get: (id: string): Promise<Mission> =>
      this.request('GET', `/missions/${id}`),

    checkin: (id: string, lat: number, lng: number): Promise<Mission> =>
      this.request('POST', `/missions/${id}/checkin`, { lat, lng }),

    start: (id: string): Promise<Mission> =>
      this.request('POST', `/missions/${id}/start`),

    addPhoto: (
      id: string,
      photoUrl: string,
      photoType: string,
      caption?: string,
      lat?: number,
      lng?: number
    ): Promise<MissionPhoto> =>
      this.request('POST', `/missions/${id}/photos?photo_url=${encodeURIComponent(photoUrl)}`, {
        photo_type: photoType,
        caption,
        lat,
        lng,
      }),

    getPhotos: (id: string): Promise<MissionPhoto[]> =>
      this.request('GET', `/missions/${id}/photos`),

    addSignature: (id: string, signatureBase64: string, name: string): Promise<Mission> =>
      this.request('POST', `/missions/${id}/signature`, {
        signature_image_base64: signatureBase64,
        signature_name: name,
      }),

    complete: (id: string, notes?: string, issues?: string): Promise<Mission> =>
      this.request('POST', `/missions/${id}/complete`, {
        plumber_notes: notes,
        issues_reported: issues,
      }),
  };

  // Invoice endpoints
  invoices = {
    getByOrder: (orderId: string): Promise<Invoice> =>
      this.request('GET', `/invoices/order/${orderId}`),

    get: (id: string): Promise<Invoice> =>
      this.request('GET', `/invoices/${id}`),

    getItems: (id: string): Promise<InvoiceItem[]> =>
      this.request('GET', `/invoices/${id}/items`),

    getPdfUrl: (id: string): Promise<{ pdf_url: string }> =>
      this.request('GET', `/invoices/${id}/pdf`),
  };

  // Stripe Connect endpoints (plumber)
  stripeConnect = {
    createOnboardingLink: (): Promise<{ url: string }> =>
      this.request('POST', '/users/plumber/stripe-onboarding'),

    getStatus: (): Promise<{
      hasAccount: boolean;
      onboardingComplete: boolean;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
    }> => this.request('GET', '/users/plumber/stripe-status'),
  };

  // Verification endpoints
  verifications = {
    listPending: (): Promise<any[]> =>
      this.request('GET', '/verifications/pending'),

    listMine: (status?: string): Promise<any[]> => {
      const query = status ? `?status_filter=${status}` : '';
      return this.request('GET', `/verifications/plumber${query}`);
    },

    getByMission: (missionId: string): Promise<any> =>
      this.request('GET', `/verifications/mission/${missionId}`),

    get: (id: string): Promise<any> =>
      this.request('GET', `/verifications/${id}`),

    accept: (id: string, scheduledDate?: string): Promise<any> =>
      this.request('POST', `/verifications/${id}/accept`, {
        scheduled_date: scheduledDate,
      }),

    start: (id: string): Promise<any> =>
      this.request('POST', `/verifications/${id}/start`),

    complete: (id: string, data: {
      approved: boolean;
      checklist?: Array<{ item: string; passed: boolean; notes?: string }>;
      issues?: string;
      verifierNotes?: string;
      photoUrls?: string[];
    }): Promise<any> =>
      this.request('POST', `/verifications/${id}/complete`, {
        approved: data.approved,
        checklist: data.checklist || [],
        issues: data.issues,
        verifier_notes: data.verifierNotes,
        photo_urls: data.photoUrls || [],
      }),
  };

  // Payment endpoints
  payments = {
    createIntent: (orderId: string): Promise<{ client_secret: string; payment_intent_id: string }> =>
      this.request('POST', `/payments/orders/${orderId}/create-intent`),
  };

  // Project endpoints (admin)
  projects = {
    list: (status?: string): Promise<Project[]> => {
      const query = status ? `?status_filter=${status}` : '';
      return this.request('GET', `/admin/projects${query}`);
    },

    get: (id: string): Promise<Project> =>
      this.request('GET', `/admin/projects/${id}`),

    create: (data: Partial<Project>): Promise<Project> =>
      this.request('POST', '/admin/projects', data),

    update: (id: string, data: Partial<Project>): Promise<Project> =>
      this.request('PATCH', `/admin/projects/${id}`, data),

    getStats: (id: string): Promise<ProjectStats> =>
      this.request('GET', `/admin/projects/${id}/stats`),
  };
}

// Default export for convenience
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
