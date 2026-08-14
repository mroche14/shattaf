import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Phone,
  Mail,
  Globe,
  Building,
  User,
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
  Settings,
} from 'lucide-react';
import { adminApi, Prospect, ContactStatus, ProspectListParams } from '../../api/client';
import ProspectStats from './components/ProspectStats';
import ProspectDetail from './ProspectDetail';

const DEPARTMENT_NAMES: Record<string, string> = {
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
  '974': 'Réunion',
};

const STATUS_CONFIG: Record<ContactStatus, { label: string; class: string }> = {
  not_contacted: { label: 'Non contacté', class: 'bg-gray-500/20 text-gray-300' },
  contacted: { label: 'Contacté', class: 'bg-blue-500/20 text-blue-300' },
  interested: { label: 'Intéressé', class: 'bg-emerald-500/20 text-emerald-300' },
  not_interested: { label: 'Non intéressé', class: 'bg-red-500/20 text-red-300' },
  registered: { label: 'Inscrit', class: 'bg-indigo-500/20 text-indigo-300' },
};

const TYPE_BADGE_CONFIG: Record<string, { label: string; badge: string; avatarBg: string }> = {
  EI:      { label: 'EI',      badge: 'bg-amber-500/20 text-amber-300',   avatarBg: 'bg-gradient-to-br from-amber-600 to-amber-700' },
  SAS:     { label: 'SAS',     badge: 'bg-teal-500/20 text-teal-300',     avatarBg: 'bg-gradient-to-br from-teal-600 to-teal-700' },
  EURL:    { label: 'EURL',    badge: 'bg-orange-500/20 text-orange-300', avatarBg: 'bg-gradient-to-br from-orange-600 to-orange-700' },
  SARL:    { label: 'SARL',    badge: 'bg-indigo-500/20 text-indigo-300', avatarBg: 'bg-gradient-to-br from-indigo-600 to-indigo-700' },
  autre:   { label: 'Autre',   badge: 'bg-gray-500/20 text-gray-300',     avatarBg: 'bg-gradient-to-br from-slate-600 to-slate-700' },
  inconnu: { label: 'Inconnu', badge: 'bg-gray-500/20 text-gray-400',     avatarBg: 'bg-gradient-to-br from-slate-600 to-slate-700' },
};

type ColumnKey = 'name' | 'siren' | 'department' | 'city' | 'phone' | 'email' | 'website' | 'type' | 'source' | 'status' | 'actions';

const DEFAULT_COLUMNS: ColumnKey[] = ['name', 'department', 'city', 'phone', 'email', 'type', 'status', 'actions'];

const COLUMN_LABELS: Record<ColumnKey, string> = {
  name: 'Nom / Raison sociale',
  siren: 'SIREN',
  department: 'Département',
  city: 'Ville',
  phone: 'Téléphone',
  email: 'Email',
  website: 'Site web',
  type: 'Type',
  source: 'Source',
  status: 'Statut',
  actions: 'Actions',
};

const ProspectsList: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();

  // Read initial filter values from URL query params (e.g. from Dashboard segment cards)
  const initialType = searchParams.get('typeJuridique') || 'all';
  const initialHasPhone = searchParams.get('hasTelephone') === 'true';
  const initialHasEmail = searchParams.get('hasEmail') === 'true';

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [hasPhoneFilter, setHasPhoneFilter] = useState(initialHasPhone);
  const [hasEmailFilter, setHasEmailFilter] = useState(initialHasEmail);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // UI state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(DEFAULT_COLUMNS));
  const [bulkStatus, setBulkStatus] = useState<ContactStatus | ''>('');

  // Build query params
  const params: ProspectListParams = {
    page,
    limit,
    ...(search && { search }),
    ...(departmentFilter && { departement: departmentFilter }),
    ...(statusFilter && { contactStatus: statusFilter }),
    ...(typeFilter !== 'all' && { typeJuridique: typeFilter }),
    ...(hasPhoneFilter && { hasTelephone: true }),
    ...(hasEmailFilter && { hasEmail: true }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['prospects', params],
    queryFn: () => adminApi.prospects.list(params),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => adminApi.prospects.import(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['prospect-stats'] });
      alert(`Import terminé: ${result.created} créés, ${result.updated} mis à jour`);
    },
    onError: (error: Error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ContactStatus }) =>
      adminApi.prospects.bulkUpdateStatus(ids, status),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['prospect-stats'] });
      setSelectedIds(new Set());
      setBulkStatus('');
      alert(`${result.updated} prospects mis à jour`);
    },
  });


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
      e.target.value = '';
    }
  };

  const handleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.items.map((p) => p.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkUpdate = () => {
    if (selectedIds.size === 0 || !bulkStatus) return;
    bulkUpdateMutation.mutate({
      ids: Array.from(selectedIds),
      status: bulkStatus,
    });
  };

  const toggleColumn = (col: ColumnKey) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(col)) {
      newSet.delete(col);
    } else {
      newSet.add(col);
    }
    setVisibleColumns(newSet);
  };

  const getDisplayName = (p: Prospect) =>
    p.raisonSociale ||
    [p.prenomDirigeant, p.nomDirigeant].filter(Boolean).join(' ') ||
    'Sans nom';

  return (
    <div>
      {/* Stats */}
      <ProspectStats />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Rechercher un prospect..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
          style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
        >
          <option value="">Tous les départements</option>
          <option value="971">Guadeloupe (971)</option>
          <option value="972">Martinique (972)</option>
          <option value="973">Guyane (973)</option>
          <option value="974">Réunion (974)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ContactStatus | '');
            setPage(1);
          }}
          className="rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
          style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
        >
          <option value="">Tous les statuts</option>
          {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_CONFIG[status].label}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
          style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
        >
          <option value="all">Tous les types</option>
          <option value="solo">Solo (EI+SAS+EURL)</option>
          <option value="EI">EI</option>
          <option value="SAS">SAS / SASU</option>
          <option value="EURL">EURL</option>
          <option value="SARL">SARL</option>
          <option value="autre">Autre</option>
        </select>

        <label className="flex items-center gap-2 rounded-xl px-4 py-2.5 cursor-pointer hover:border-indigo-500 transition-colors" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
          <input
            type="checkbox"
            checked={hasPhoneFilter}
            onChange={(e) => {
              setHasPhoneFilter(e.target.checked);
              setPage(1);
            }}
            className="w-4 h-4 rounded bg-[var(--bg-surface)] border-[var(--border-color)]"
          />
          <Phone className="w-4 h-4 text-emerald-400" />
          <span className="text-sm">Avec téléphone</span>
        </label>

        <label className="flex items-center gap-2 rounded-xl px-4 py-2.5 cursor-pointer hover:border-indigo-500 transition-colors" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
          <input
            type="checkbox"
            checked={hasEmailFilter}
            onChange={(e) => {
              setHasEmailFilter(e.target.checked);
              setPage(1);
            }}
            className="w-4 h-4 rounded bg-[var(--bg-surface)] border-[var(--border-color)]"
          />
          <Mail className="w-4 h-4 text-blue-400" />
          <span className="text-sm">Avec email</span>
        </label>

        <div className="relative">
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="p-2.5 rounded-xl hover:border-indigo-500 transition-colors"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}
            title="Colonnes"
          >
            <Settings className="w-5 h-5" />
          </button>
          {showColumnSettings && (
            <div className="absolute right-0 top-full mt-2 rounded-xl p-3 shadow-xl z-10 min-w-48" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Colonnes visibles</p>
              {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 py-1 cursor-pointer hover:text-white transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col)}
                    onChange={() => toggleColumn(col)}
                    className="w-4 h-4 rounded bg-[var(--bg-surface)] border-[var(--border-color)]"
                  />
                  <span className="text-sm">{COLUMN_LABELS[col]}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          <Upload className="w-5 h-5" />
          {importMutation.isPending ? 'Import...' : 'Import CSV'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
          <span className="text-sm">
            <strong>{selectedIds.size}</strong> prospect(s) sélectionné(s)
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as ContactStatus | '')}
            className="rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          >
            <option value="">Changer statut...</option>
            {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkUpdate}
            disabled={!bulkStatus || bulkUpdateMutation.isPending}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Appliquer
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm hover:text-white"
            style={{ color: 'var(--text-secondary)' }}
          >
            Annuler
          </button>
        </div>
      )}

      {/* Table */}
      <div className="stat-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={data?.items && selectedIds.size === data.items.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded bg-[var(--bg-surface)] border-[var(--border-color)]"
                  />
                </th>
                {visibleColumns.has('name') && <th>Nom</th>}
                {visibleColumns.has('siren') && <th>SIREN</th>}
                {visibleColumns.has('department') && <th>Département</th>}
                {visibleColumns.has('city') && <th>Ville</th>}
                {visibleColumns.has('phone') && <th>Téléphone</th>}
                {visibleColumns.has('email') && <th>Email</th>}
                {visibleColumns.has('website') && <th>Site</th>}
                {visibleColumns.has('type') && <th>Type</th>}
                {visibleColumns.has('source') && <th>Source</th>}
                {visibleColumns.has('status') && <th>Statut</th>}
                {visibleColumns.has('actions') && <th></th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={visibleColumns.size + 1}>
                      <div className="h-12 rounded animate-pulse" style={{ background: 'var(--bg-surface)' }} />
                    </td>
                  </tr>
                ))
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((prospect) => (
                  <tr key={prospect.id} className={selectedIds.has(prospect.id) ? 'bg-indigo-500/5' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(prospect.id)}
                        onChange={() => handleSelect(prospect.id)}
                        className="w-4 h-4 rounded bg-[var(--bg-surface)] border-[var(--border-color)]"
                      />
                    </td>
                    {visibleColumns.has('name') && (
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${TYPE_BADGE_CONFIG[prospect.typeJuridique]?.avatarBg ?? 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
                            {['EI', 'SAS', 'EURL'].includes(prospect.typeJuridique) ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Building className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{getDisplayName(prospect)}</p>
                            {prospect.raisonSociale && prospect.nomDirigeant && (
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                {prospect.prenomDirigeant} {prospect.nomDirigeant}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.has('siren') && (
                      <td>
                        {prospect.siren ? (
                          <span className="font-mono text-sm">{prospect.siren}</span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has('department') && (
                      <td>
                        {prospect.departement ? (
                          <span className="badge badge-info">
                            {DEPARTMENT_NAMES[prospect.departement] || prospect.departement}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has('city') && (
                      <td>
                        {prospect.ville ? (
                          <span className="text-sm">{prospect.ville}</span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has('phone') && (
                      <td>
                        {prospect.telephone ? (
                          <a
                            href={`tel:${prospect.telephone}`}
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Phone className="w-3 h-3" />
                            <span className="text-sm">{prospect.telephone}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has('email') && (
                      <td>
                        {prospect.email ? (
                          <a
                            href={`mailto:${prospect.email}`}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                            title={prospect.email}
                          >
                            <Mail className="w-3 h-3" />
                            <span className="text-sm truncate max-w-32">{prospect.email}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has('website') && (
                      <td>
                        {prospect.siteWeb ? (
                          <a
                            href={prospect.siteWeb.startsWith('http') ? prospect.siteWeb : `https://${prospect.siteWeb}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                          >
                            <Globe className="w-3 h-3" />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has('type') && (
                      <td>
                        <span
                          className={`badge ${TYPE_BADGE_CONFIG[prospect.typeJuridique]?.badge ?? 'bg-gray-500/20 text-gray-300'}`}
                        >
                          {TYPE_BADGE_CONFIG[prospect.typeJuridique]?.label ?? prospect.typeJuridique}
                        </span>
                      </td>
                    )}
                    {visibleColumns.has('source') && (
                      <td>
                        {prospect.provenance ? (
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{prospect.provenance}</span>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.has('status') && (
                      <td>
                        <span className={`badge ${STATUS_CONFIG[prospect.contactStatus]?.class}`}>
                          {STATUS_CONFIG[prospect.contactStatus]?.label}
                        </span>
                      </td>
                    )}
                    {visibleColumns.has('actions') && (
                      <td>
                        <button
                          onClick={() => setSelectedProspect(prospect)}
                          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visibleColumns.size + 1} className="text-center py-12">
                    <User className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Aucun prospect trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Page {data.page} sur {data.pages} ({data.total} résultats)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedProspect && (
        <ProspectDetail
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
        />
      )}
    </div>
  );
};

export default ProspectsList;
