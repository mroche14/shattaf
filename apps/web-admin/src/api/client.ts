import { useAuthStore } from '../store/auth';

const API_BASE = '/api/v1';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({ detail: 'Erreur serveur' }));
    throw new Error(error.detail || 'Erreur serveur');
  }

  return response.json();
}

export const adminApi = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      request<{ accessToken: string; user: unknown }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  // Dashboard stats
  dashboard: {
    getStats: () =>
      request<{
        totalPlumbers: number;
        activePlumbers: number;
        totalCustomers: number;
        totalBookings: number;
        pendingBookings: number;
        totalOrders: number;
        totalRevenue: number;
        todayMissions: number;
        completedMissions: number;
        byDepartment: {
          department: string;
          plumbers: number;
          bookings: number;
          revenue: number;
        }[];
      }>('/admin/stats'),
  },

  // Plumbers
  plumbers: {
    list: (params?: { department?: string; status?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<{
        items: PlumberWithUser[];
        total: number;
      }>(`/admin/plumbers${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<PlumberWithUser>(`/admin/plumbers/${id}`),
    updateStatus: (id: string, status: string) =>
      request(`/admin/plumbers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    updateDepartment: (id: string, department: string) =>
      request(`/admin/plumbers/${id}/department`, {
        method: 'PATCH',
        body: JSON.stringify({ department }),
      }),
    addInterventionLocation: (id: string, location: InterventionLocation) =>
      request(`/admin/plumbers/${id}/intervention-locations`, {
        method: 'POST',
        body: JSON.stringify(location),
      }),
    removeInterventionLocation: (id: string, index: number) =>
      request(`/admin/plumbers/${id}/intervention-locations/${index}`, {
        method: 'DELETE',
      }),
  },

  // Coverage map data
  coverage: {
    getPlumberLocations: (department?: string) => {
      const query = department ? `?department=${department}` : '';
      return request<PlumberLocation[]>(`/admin/coverage/plumbers${query}`);
    },
    getBookingLocations: (department?: string) => {
      const query = department ? `?department=${department}` : '';
      return request<BookingLocation[]>(`/admin/coverage/bookings${query}`);
    },
    getCoverageStats: () =>
      request<{
        departments: {
          code: string;
          name: string;
          plumberCount: number;
          bookingCount: number;
          coverageScore: number;
          center: { lat: number; lng: number };
        }[];
      }>('/admin/coverage/stats'),
    computeDeadZones: (data: DeadZoneRequest) =>
      request<DeadZoneResponse>('/admin/coverage/dead-zones', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDepartmentBoundary: (dept: string) =>
      request<{ geojson: object }>(`/admin/coverage/boundary/${dept}`),
  },

  // Customers
  customers: {
    list: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<{ items: CustomerWithUser[]; total: number }>(`/admin/customers${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<CustomerWithUser>(`/admin/customers/${id}`),
  },

  // Bookings
  bookings: {
    list: (params?: { status?: string; page?: number }) => {
      const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<{ items: BookingFull[]; total: number }>(`/admin/bookings${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<BookingFull>(`/admin/bookings/${id}`),
  },

  // Orders
  orders: {
    list: (params?: { status?: string; page?: number }) => {
      const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<{ items: OrderFull[]; total: number }>(`/admin/orders${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<OrderFull>(`/admin/orders/${id}`),
  },

  // Missions
  missions: {
    list: (params?: { status?: string; plumberId?: string; page?: number }) => {
      const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<{ items: MissionFull[]; total: number }>(`/admin/missions${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<MissionFull>(`/admin/missions/${id}`),
  },

  // Invoices
  invoices: {
    list: (params?: { page?: number }) => {
      const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<{ items: InvoiceFull[]; total: number }>(`/admin/invoices${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<InvoiceFull>(`/admin/invoices/${id}`),
    downloadPdf: (id: string) => `/api/v1/admin/invoices/${id}/pdf`,
  },

  // Products
  products: {
    list: () => request<ProductAdmin[]>('/admin/products'),
    create: (data: ProductCreate) =>
      request('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<ProductCreate>) =>
      request(`/admin/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/admin/products/${id}`, {
        method: 'DELETE',
      }),
  },

  // Matching simulation
  matching: {
    simulate: (bookingId: string) =>
      request<{
        booking: BookingFull;
        matchedPlumbers: {
          plumber: PlumberWithUser;
          distance: number;
          score: number;
        }[];
      }>(`/admin/matching/simulate/${bookingId}`),
    getUnmatchedBookings: () =>
      request<BookingFull[]>('/admin/matching/unmatched'),
    simulatePoint: (data: SimulatePointRequest) =>
      request<SimulatePointResponse>('/admin/matching/simulate-point', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    geocodeAddress: (address: string, department?: string) =>
      request<GeocodeAddressResult>('/admin/matching/geocode', {
        method: 'POST',
        body: JSON.stringify({ address, department }),
      }),
  },

  // Projects
  projects: {
    list: (status?: string) => {
      const query = status ? `?status_filter=${status}` : '';
      return request<ProjectAdmin[]>(`/admin/projects${query}`);
    },
    get: (id: string) => request<ProjectAdmin>(`/admin/projects/${id}`),
    create: (data: ProjectCreate) =>
      request<ProjectAdmin>('/admin/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<ProjectCreate>) =>
      request<ProjectAdmin>(`/admin/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getStats: (id: string) => request<ProjectStatsAdmin>(`/admin/projects/${id}/stats`),
  },

  // Audit logs
  audit: {
    list: (params?: { entityType?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams(params as unknown as Record<string, string>).toString();
      return request<{ items: AuditLog[]; total: number }>(`/admin/audit${query ? `?${query}` : ''}`);
    },
  },

  // Prospects
  prospects: {
    list: (params?: ProspectListParams) => {
      // Convert camelCase params to snake_case for API
      const paramMap: Record<string, string> = {
        contactStatus: 'contact_status',
        typeJuridique: 'type_juridique',
        hasTelephone: 'has_telephone',
        hasEmail: 'has_email',
      };
      const query = params ? new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [paramMap[k] || k, String(v)])
      ).toString() : '';
      return request<ProspectListResponse>(`/admin/prospects${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<Prospect>(`/admin/prospects/${id}`),
    getStats: () => request<ProspectStats>('/admin/prospects/stats'),
    update: (id: string, data: ProspectUpdateData) =>
      request<Prospect>(`/admin/prospects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    bulkUpdateStatus: (prospectIds: string[], contactStatus: ContactStatus) =>
      request<{ updated: number }>('/admin/prospects/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ prospect_ids: prospectIds, contact_status: contactStatus }),
      }),
    getMap: (departement?: string) => {
      const query = departement ? `?departement=${departement}` : '';
      return request<ProspectMapItem[]>(`/admin/prospects/map${query}`);
    },
    geocode: () =>
      request<GeocodeResult>('/admin/prospects/geocode', {
        method: 'POST',
      }),
    import: async (file: File) => {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/admin/prospects/import`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Erreur serveur' }));
        throw new Error(error.detail || 'Erreur serveur');
      }

      return response.json() as Promise<ImportResult>;
    },
  },
};

// Types
interface PlumberWithUser {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: string;
  };
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  department?: '971' | '972' | '973';
  companyName?: string;
  siren?: string;
  siret?: string;
  serviceAreaLat?: number;
  serviceAreaLng?: number;
  serviceAreaRadiusKm: number;
  interventionLocations: InterventionLocation[];
  totalMissionsCompleted: number;
  averageRating?: number;
  totalRatings: number;
  stripeChargesEnabled: boolean;
  mandateSigned: boolean;
  createdAt: string;
}

interface InterventionLocation {
  lat: number;
  lng: number;
  address: string;
  label: string;
}

interface PlumberLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  department: string;
  status: string;
  interventionLocations: InterventionLocation[];
}

interface BookingLocation {
  id: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
}

interface CustomerWithUser {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    createdAt: string;
  };
  defaultAddress?: string;
  defaultCity?: string;
  defaultPostalCode?: string;
  totalOrders: number;
  createdAt: string;
}

interface BookingFull {
  id: string;
  customerId: string;
  customer?: CustomerWithUser;
  status: string;
  addressStreet: string;
  addressCity: string;
  addressPostalCode: string;
  lat?: number;
  lng?: number;
  toiletType: string;
  hasShutoffValve: boolean;
  preferredDate?: string;
  preferredTimeSlot?: string;
  photoUrls: string[];
  createdAt: string;
}

interface OrderFull {
  id: string;
  bookingId: string;
  customerId: string;
  plumberId?: string;
  status: string;
  totalAmount: number;
  productAmount: number;
  installationAmount: number;
  platformFee: number;
  scheduledDate?: string;
  createdAt: string;
}

interface MissionFull {
  id: string;
  orderId: string;
  plumberId: string;
  plumber?: PlumberWithUser;
  status: string;
  scheduledDate: string;
  checkinLat?: number;
  checkinLng?: number;
  checkinTime?: string;
  startTime?: string;
  completedAt?: string;
  photoBeforeUrls: string[];
  photoAfterUrls: string[];
  signatureName?: string;
  createdAt: string;
}

interface InvoiceFull {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  customer?: CustomerWithUser;
  plumberId: string;
  plumber?: PlumberWithUser;
  totalAmount: number;
  productAmount: number;
  installationAmount: number;
  vatAmount: number;
  status: string;
  issuedAt: string;
  paidAt?: string;
}

interface ProjectAdmin {
  id: string;
  name: string;
  slug: string;
  type: 'internal' | 'marketplace';
  status: 'draft' | 'active' | 'paused' | 'archived';
  description?: string;
  department?: string;
  landingPageUrl?: string;
  marketingConfig?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

interface ProjectStatsAdmin {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  bookingCount: number;
  orderCount: number;
  revenue: number;
}

interface ProjectCreate {
  name: string;
  slug: string;
  type?: 'internal' | 'marketplace';
  status?: 'draft' | 'active' | 'paused' | 'archived';
  description?: string;
  department?: string;
  landingPageUrl?: string;
}

interface ProductAdmin {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceB2C: number;
  priceB2B?: number;
  installationPrice: number;
  imageUrl?: string;
  isActive: boolean;
  stockQuantity: number;
  createdAt: string;
}

interface ProductCreate {
  name: string;
  slug: string;
  description: string;
  priceB2C: number;
  priceB2B?: number;
  installationPrice: number;
  imageUrl?: string;
  isActive?: boolean;
  stockQuantity?: number;
}

interface AuditLog {
  id: string;
  userId?: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// Prospect types
type ContactStatus = 'not_contacted' | 'contacted' | 'interested' | 'not_interested' | 'registered';

interface Prospect {
  id: string;
  siren?: string;
  siret?: string;
  raisonSociale?: string;
  nomDirigeant?: string;
  prenomDirigeant?: string;
  codeApe?: string;
  formeJuridique?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  departement?: string;
  telephone?: string;
  telephone2?: string;
  email?: string;
  siteWeb?: string;
  dateCreation?: string;
  certifications?: string;
  noteAvis?: number;
  nbAvis?: number;
  statut?: string;
  individuel?: boolean;
  typeJuridique: string;
  provenance?: string;
  sources?: string;
  contactStatus: ContactStatus;
  contactNotes?: string;
  lastContactedAt?: string;
  linkedPlumberId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ProspectListParams {
  departement?: string;
  contactStatus?: ContactStatus;
  typeJuridique?: string;
  hasTelephone?: boolean;
  hasEmail?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface ProspectListResponse {
  items: Prospect[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ProspectBreakdown {
  soloWithPhone: number;
  soloWithEmail: number;
  societeWithPhone: number;
  societeWithEmail: number;
  unknownWithPhone: number;
  unknownWithEmail: number;
}

interface ProspectStats {
  total: number;
  withTelephone: number;
  withEmail: number;
  byStatus: Record<string, number>;
  byDepartement: Record<string, number>;
  byTypeJuridique: Record<string, number>;
  soloCount: number;
  societeCount: number;
  breakdown: ProspectBreakdown;
}

interface ProspectUpdateData {
  contact_status?: ContactStatus;
  contact_notes?: string;
}

interface ImportResult {
  totalRows: number;
  created: number;
  updated: number;
  errors: string[];
}

interface ProspectMapItem {
  id: string;
  lat: number;
  lng: number;
  name: string;
  departement?: string;
  contactStatus: ContactStatus;
  typeJuridique: string;
  telephone?: string;
  email?: string;
  ville?: string;
}

interface GeocodeResult {
  geocoded: number;
  failed: number;
  skipped: number;
}

// Dead zone types
interface DeadZoneRequest {
  department: string;
  mode: 'distance' | 'time';
  threshold: number;
  extra_locations?: { lat: number; lng: number }[];
  include_plumbers?: boolean;
  force?: boolean;
}

interface DeadZoneResponse {
  department: string;
  mode: string;
  threshold: number;
  geojson: object | null;
  stats: { department_area_km2: number; dead_zone_area_km2: number; coverage_percent: number };
  plumber_count: number;
  point_count: number;
  compute_ms: number;
  cached: boolean;
  cached_at: string | null;
}

// Matching simulation types
interface SimulatePointRequest {
  lat: number;
  lng: number;
  department?: string;
  weights?: { proximity: number; quality: number; load: number };
}

interface GeocodeAddressResult {
  lat: number;
  lng: number;
  label: string;
  score: number;
}

interface PlumberScoreItem {
  plumber_id: string;
  name: string;
  distance_km: number;
  total_score: number;
  proximity_score: number;
  quality_score: number;
  load_score: number;
  total_missions_completed: number;
  average_rating: number | null;
  total_ratings: number;
  lat: number;
  lng: number;
  radius_km: number;
  rank: number;
}

interface SimulatePointResponse {
  point: { lat: number; lng: number };
  weights: { proximity: number; quality: number; load: number };
  results: PlumberScoreItem[];
  total_candidates: number;
}

export type {
  ProjectAdmin,
  ProjectStatsAdmin,
  ProjectCreate as ProjectCreateData,
  PlumberWithUser,
  InterventionLocation,
  PlumberLocation,
  BookingLocation,
  DeadZoneRequest,
  DeadZoneResponse,
  CustomerWithUser,
  BookingFull,
  OrderFull,
  MissionFull,
  InvoiceFull,
  ProductAdmin,
  ProductCreate,
  AuditLog,
  Prospect,
  ProspectListParams,
  ProspectListResponse,
  ProspectStats,
  ProspectBreakdown,
  ProspectUpdateData,
  ContactStatus,
  ImportResult,
  ProspectMapItem,
  GeocodeResult,
  SimulatePointRequest,
  PlumberScoreItem,
  SimulatePointResponse,
  GeocodeAddressResult,
};
