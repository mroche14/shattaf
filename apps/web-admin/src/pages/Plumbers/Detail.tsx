import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Building,
  MapPin,
  Star,
  FileText,
  CreditCard,
  Shield,
  Phone,
  Mail,
  Calendar,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { adminApi, InterventionLocation } from '../../api/client';

const DEPARTMENT_OPTIONS = [
  { value: '971', label: 'Guadeloupe (971)' },
  { value: '972', label: 'Martinique (972)' },
  { value: '973', label: 'Guyane (973)' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'active', label: 'Actif' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'inactive', label: 'Inactif' },
];

const plumberIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6366f1" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#6366f1"/>
      <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const interventionIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="24" height="24">
      <polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8" fill="#f59e0b"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const PlumberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<InterventionLocation>>({});

  const { data: plumber, isLoading } = useQuery({
    queryKey: ['plumber', id],
    queryFn: () => adminApi.plumbers.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => adminApi.plumbers.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber', id] });
      queryClient.invalidateQueries({ queryKey: ['plumbers'] });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: (department: string) => adminApi.plumbers.updateDepartment(id!, department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber', id] });
      queryClient.invalidateQueries({ queryKey: ['plumbers'] });
    },
  });

  const addLocationMutation = useMutation({
    mutationFn: (location: InterventionLocation) =>
      adminApi.plumbers.addInterventionLocation(id!, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber', id] });
      setIsAddingLocation(false);
      setNewLocation({});
    },
  });

  const removeLocationMutation = useMutation({
    mutationFn: (index: number) => adminApi.plumbers.removeInterventionLocation(id!, index),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plumber', id] });
    },
  });

  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click: (e) => {
        if (isAddingLocation) {
          setNewLocation({
            ...newLocation,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          });
        }
      },
    });
    return null;
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!plumber) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold mb-4">Plombier non trouvé</h1>
        <Link to="/plumbers" className="text-indigo-400">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const mapCenter: [number, number] = plumber.serviceAreaLat && plumber.serviceAreaLng
    ? [plumber.serviceAreaLat, plumber.serviceAreaLng]
    : [16.265, -61.551];

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/plumbers"
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">
            {plumber.user.firstName} {plumber.user.lastName}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{plumber.companyName || 'Plombier indépendant'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile card */}
          <div className="stat-card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                {plumber.user.firstName.charAt(0)}
                {plumber.user.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {plumber.user.firstName} {plumber.user.lastName}
                </h2>
                {plumber.averageRating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>{plumber.averageRating.toFixed(1)}</span>
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      ({plumber.totalRatings} avis)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Mail className="w-4 h-4" />
                <span>{plumber.user.email}</span>
              </div>
              {plumber.user.phone && (
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Phone className="w-4 h-4" />
                  <span>{plumber.user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-4 h-4" />
                <span>
                  Inscrit le{' '}
                  {new Date(plumber.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Status & Department */}
          <div className="stat-card">
            <h3 className="font-bold mb-4">Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Statut</label>
                <select
                  value={plumber.status}
                  onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                  disabled={updateStatusMutation.isPending}
                  className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Département
                </label>
                <select
                  value={plumber.department || ''}
                  onChange={(e) => updateDepartmentMutation.mutate(e.target.value)}
                  disabled={updateDepartmentMutation.isPending}
                  className="w-full rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                >
                  <option value="">Non défini</option>
                  {DEPARTMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Business info */}
          <div className="stat-card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              Entreprise
            </h3>
            <div className="space-y-3 text-sm">
              <InfoRow label="Raison sociale" value={plumber.companyName} />
              <InfoRow label="SIREN" value={plumber.siren} />
              <InfoRow label="SIRET" value={plumber.siret} />
            </div>
          </div>

          {/* Stripe */}
          <div className="stat-card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Stripe Connect
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Charges activées</span>
                <StatusIcon active={plumber.stripeChargesEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Onboarding complet</span>
                <StatusIcon active={plumber.stripeChargesEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Mandat signé</span>
                <StatusIcon active={plumber.mandateSigned} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stat-card">
            <h3 className="font-bold mb-4">Statistiques</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-surface)] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-indigo-400">
                  {plumber.totalJobsCompleted}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Missions</p>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {plumber.averageRating?.toFixed(1) || '-'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Note moyenne</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Map & Locations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                Zone de service & Interventions
              </h3>
              <button
                onClick={() => setIsAddingLocation(!isAddingLocation)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isAddingLocation
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {isAddingLocation ? (
                  <>
                    <X className="w-4 h-4" />
                    Annuler
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Ajouter zone
                  </>
                )}
              </button>
            </div>

            {isAddingLocation && (
              <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-300 text-sm mb-3">
                  Cliquez sur la carte pour positionner la zone d'intervention
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Label (ex: Centre-ville)"
                    value={newLocation.label || ''}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, label: e.target.value })
                    }
                    className="rounded-lg px-3 py-2 text-sm outline-none transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={newLocation.address || ''}
                    onChange={(e) =>
                      setNewLocation({ ...newLocation, address: e.target.value })
                    }
                    className="rounded-lg px-3 py-2 text-sm outline-none transition-colors" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>
                {newLocation.lat && newLocation.lng && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Position: {newLocation.lat.toFixed(5)}, {newLocation.lng.toFixed(5)}
                    </span>
                    <button
                      onClick={() => {
                        if (newLocation.lat && newLocation.lng) {
                          addLocationMutation.mutate({
                            lat: newLocation.lat,
                            lng: newLocation.lng,
                            label: newLocation.label || 'Zone intervention',
                            address: newLocation.address || '',
                          });
                        }
                      }}
                      disabled={addLocationMutation.isPending}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Confirmer
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="h-96 rounded-xl overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={11}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapClickHandler />

                {/* Service area */}
                {plumber.serviceAreaLat && plumber.serviceAreaLng && (
                  <>
                    <Marker
                      position={[plumber.serviceAreaLat, plumber.serviceAreaLng]}
                      icon={plumberIcon}
                    />
                    <Circle
                      center={[plumber.serviceAreaLat, plumber.serviceAreaLng]}
                      radius={plumber.serviceAreaRadiusKm * 1000}
                      pathOptions={{
                        color: '#6366f1',
                        fillColor: '#6366f1',
                        fillOpacity: 0.1,
                        weight: 2,
                      }}
                    />
                  </>
                )}

                {/* Intervention locations */}
                {plumber.interventionLocations.map((loc, idx) => (
                  <Marker
                    key={idx}
                    position={[loc.lat, loc.lng]}
                    icon={interventionIcon}
                  />
                ))}

                {/* New location preview */}
                {isAddingLocation && newLocation.lat && newLocation.lng && (
                  <Marker
                    position={[newLocation.lat, newLocation.lng]}
                    icon={interventionIcon}
                  />
                )}
              </MapContainer>
            </div>
          </div>

          {/* Intervention locations list */}
          <div className="stat-card">
            <h3 className="font-bold mb-4">Zones d'intervention</h3>
            {plumber.interventionLocations.length > 0 ? (
              <div className="space-y-2">
                {plumber.interventionLocations.map((loc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[var(--bg-surface)] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium">{loc.label}</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{loc.address}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeLocationMutation.mutate(idx)}
                      disabled={removeLocationMutation.isPending}
                      className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                Aucune zone d'intervention définie
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex justify-between">
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <span className="font-medium">{value || '-'}</span>
  </div>
);

const StatusIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`w-5 h-5 rounded-full flex items-center justify-center ${
      active ? 'bg-emerald-500/20' : 'bg-red-500/20'
    }`}
  >
    {active ? (
      <Check className="w-3 h-3 text-emerald-400" />
    ) : (
      <X className="w-3 h-3 text-red-400" />
    )}
  </span>
);

export default PlumberDetailPage;
