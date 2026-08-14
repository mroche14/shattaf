import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  Star,
  ExternalLink,
  Save,
} from 'lucide-react';
import { adminApi, Prospect, ContactStatus } from '../../api/client';

interface ProspectDetailProps {
  prospect: Prospect;
  onClose: () => void;
}

const STATUS_CONFIG: Record<ContactStatus, { label: string; class: string }> = {
  not_contacted: { label: 'Non contacté', class: 'bg-gray-500/20 text-gray-300' },
  contacted: { label: 'Contacté', class: 'bg-blue-500/20 text-blue-300' },
  interested: { label: 'Intéressé', class: 'bg-emerald-500/20 text-emerald-300' },
  not_interested: { label: 'Non intéressé', class: 'bg-red-500/20 text-red-300' },
  registered: { label: 'Inscrit', class: 'bg-indigo-500/20 text-indigo-300' },
};

const ProspectDetail: React.FC<ProspectDetailProps> = ({ prospect, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<ContactStatus>(prospect.contactStatus);
  const [notes, setNotes] = useState(prospect.contactNotes || '');
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.prospects.update(prospect.id, {
        contact_status: selectedStatus,
        contact_notes: notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['prospect-stats'] });
      setHasChanges(false);
    },
  });

  const handleStatusChange = (status: ContactStatus) => {
    setSelectedStatus(status);
    setHasChanges(true);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(true);
  };

  const displayName =
    prospect.raisonSociale ||
    [prospect.prenomDirigeant, prospect.nomDirigeant].filter(Boolean).join(' ') ||
    'Sans nom';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors" style={{ background: 'var(--bg-panel)' }}>
        {/* Header */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{displayName}</h2>
              {prospect.siren && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>SIREN: {prospect.siren}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Statut de contact</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as ContactStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedStatus === status
                      ? STATUS_CONFIG[status].class + ' ring-2 ring-white/20'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:brightness-110'
                  }`}
                >
                  {STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Coordonnées</h3>
            <div className="space-y-3">
              {prospect.telephone && (
                <a
                  href={`tel:${prospect.telephone}`}
                  className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-lg hover:brightness-110 transition-colors"
                >
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <span>{prospect.telephone}</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-[var(--text-tertiary)]" />
                </a>
              )}
              {prospect.telephone2 && (
                <a
                  href={`tel:${prospect.telephone2}`}
                  className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-lg hover:brightness-110 transition-colors"
                >
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <span>{prospect.telephone2}</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-[var(--text-tertiary)]" />
                </a>
              )}
              {prospect.email && (
                <a
                  href={`mailto:${prospect.email}`}
                  className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-lg hover:brightness-110 transition-colors"
                >
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>{prospect.email}</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-[var(--text-tertiary)]" />
                </a>
              )}
              {prospect.siteWeb && (
                <a
                  href={prospect.siteWeb.startsWith('http') ? prospect.siteWeb : `https://${prospect.siteWeb}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[var(--bg-surface)] rounded-lg hover:brightness-110 transition-colors"
                >
                  <Globe className="w-5 h-5 text-indigo-400" />
                  <span className="truncate">{prospect.siteWeb}</span>
                  <ExternalLink className="w-4 h-4 ml-auto text-[var(--text-tertiary)]" />
                </a>
              )}
            </div>
          </div>

          {/* Address */}
          {(prospect.adresse || prospect.ville) && (
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Adresse</h3>
              <div className="flex items-start gap-3 p-3 bg-[var(--bg-surface)] rounded-lg">
                <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div>
                  {prospect.adresse && <p>{prospect.adresse}</p>}
                  <p>
                    {[prospect.codePostal, prospect.ville].filter(Boolean).join(' ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Business info */}
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Informations entreprise</h3>
            <div className="grid grid-cols-2 gap-3">
              {prospect.siret && (
                <div className="p-3 bg-[var(--bg-surface)] rounded-lg">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>SIRET</p>
                  <p className="font-mono text-sm">{prospect.siret}</p>
                </div>
              )}
              {prospect.codeApe && (
                <div className="p-3 bg-[var(--bg-surface)] rounded-lg">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Code APE</p>
                  <p className="font-mono text-sm">{prospect.codeApe}</p>
                </div>
              )}
              {prospect.formeJuridique && (
                <div className="p-3 bg-[var(--bg-surface)] rounded-lg">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Forme juridique</p>
                  <p className="text-sm">{prospect.formeJuridique}</p>
                </div>
              )}
              {prospect.dateCreation && (
                <div className="p-3 bg-[var(--bg-surface)] rounded-lg">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Date de création</p>
                  <p className="text-sm">{prospect.dateCreation}</p>
                </div>
              )}
              <div className="p-3 bg-[var(--bg-surface)] rounded-lg">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Type juridique</p>
                <p className="text-sm font-medium">
                  {prospect.typeJuridique?.toUpperCase() ?? 'Inconnu'}
                </p>
              </div>
              {prospect.noteAvis !== undefined && prospect.noteAvis !== null && (
                <div className="p-3 bg-[var(--bg-surface)] rounded-lg">
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Note</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm">{prospect.noteAvis}</span>
                    {prospect.nbAvis && (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>({prospect.nbAvis} avis)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Source */}
          {(prospect.provenance || prospect.sources) && (
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Source des données</h3>
              <div className="flex gap-2">
                {prospect.provenance && (
                  <span className="px-3 py-1 bg-[var(--bg-surface)] rounded-full text-sm">
                    {prospect.provenance}
                  </span>
                )}
                {prospect.sources && (
                  <span className="px-3 py-1 bg-[var(--bg-surface)] rounded-full text-sm">
                    {prospect.sources}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Notes de contact</h3>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Ajouter des notes sur ce prospect..."
              className="w-full rounded-lg p-4 outline-none focus:border-indigo-500 min-h-[100px] resize-y transition-colors"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            />
          </div>

          {/* Last contacted */}
          {prospect.lastContactedAt && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Calendar className="w-4 h-4" />
              Dernier contact:{' '}
              {new Date(prospect.lastContactedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 hover:text-white transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Fermer
          </button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={!hasChanges || updateMutation.isPending}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              hasChanges
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProspectDetail;
