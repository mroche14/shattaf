import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Play,
  Camera,
  Loader2,
  ClipboardCheck,
} from 'lucide-react';
import { apiClient } from '../../api/client';

const DEFAULT_CHECKLIST = [
  { item: 'Étanchéité des raccords', passed: false, notes: '' },
  { item: 'Fixation correcte', passed: false, notes: '' },
  { item: 'Propreté du chantier', passed: false, notes: '' },
  { item: 'Fonctionnement vérifié', passed: false, notes: '' },
  { item: 'Conformité aux normes', passed: false, notes: '' },
];

const VerificationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [issues, setIssues] = useState('');
  const [notes, setNotes] = useState('');

  const { data: verification, isLoading } = useQuery({
    queryKey: ['verification', id],
    queryFn: () => apiClient.verifications.get(id!),
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: () => apiClient.verifications.accept(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['verification', id] }),
  });

  const startMutation = useMutation({
    mutationFn: () => apiClient.verifications.start(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['verification', id] }),
  });

  const completeMutation = useMutation({
    mutationFn: (approved: boolean) =>
      apiClient.verifications.complete(id!, {
        approved,
        checklist,
        issues: issues || undefined,
        verifierNotes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification', id] });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });

  const toggleChecklistItem = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, passed: !item.passed } : item
      )
    );
  };

  const updateChecklistNote = (index: number, note: string) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, notes: note } : item))
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="px-4 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
        Vérification introuvable
      </div>
    );
  }

  const allPassed = checklist.every((item) => item.passed);

  return (
    <div className="px-4 pb-8">
      <button
        onClick={() => navigate('/verifications')}
        className="flex items-center gap-2 mb-6 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
            Vérification
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {(verification.verification_fee / 100).toFixed(0)} € de rémunération
          </p>
        </div>
      </div>

      {/* Status info */}
      <div className="card rounded-xl p-4 mb-4" style={{ border: '1px solid var(--border-color)' }}>
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: 'var(--text-secondary)' }}>Statut</span>
          <span className="font-medium capitalize" style={{ color: 'var(--text-main)' }}>
            {verification.status}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Mission</span>
          <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {verification.mission_id?.slice(0, 12)}...
          </span>
        </div>
      </div>

      {/* Actions based on status */}
      {verification.status === 'pending' && (
        <button
          onClick={() => acceptMutation.mutate()}
          disabled={acceptMutation.isPending}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-4"
        >
          {acceptMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Accepter cette vérification
            </>
          )}
        </button>
      )}

      {verification.status === 'accepted' && (
        <button
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mb-4"
        >
          {startMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5" />
              Démarrer la vérification
            </>
          )}
        </button>
      )}

      {verification.status === 'in_progress' && (
        <div className="space-y-4">
          {/* Checklist */}
          <div className="card rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="font-medium" style={{ color: 'var(--text-main)' }}>
                Checklist de vérification
              </h3>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {checklist.map((item, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleChecklistItem(index)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        item.passed
                          ? 'bg-emerald-500 text-white'
                          : ''
                      }`}
                      style={!item.passed ? { border: '2px solid var(--border-color)' } : undefined}
                    >
                      {item.passed && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                      {item.item}
                    </span>
                  </div>
                  {!item.passed && (
                    <input
                      value={item.notes}
                      onChange={(e) => updateChecklistNote(index, e.target.value)}
                      placeholder="Note (optionnel)..."
                      className="mt-2 ml-9 w-[calc(100%-2.25rem)] text-sm rounded-lg px-3 py-1.5"
                      style={{
                        background: 'var(--bg-inner)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <button
            className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            style={{ background: 'var(--bg-inner)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Camera className="w-5 h-5" />
            Ajouter des photos
          </button>

          {/* Issues */}
          {!allPassed && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Problèmes constatés
              </label>
              <textarea
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                rows={3}
                placeholder="Décrivez les problèmes..."
                className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                style={{
                  background: 'var(--bg-inner)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Notes du vérificateur
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notes additionnelles..."
              className="w-full rounded-xl px-4 py-3 text-sm resize-none"
              style={{
                background: 'var(--bg-inner)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
            />
          </div>

          {/* Submit buttons */}
          <div className="space-y-3">
            <button
              onClick={() => completeMutation.mutate(true)}
              disabled={completeMutation.isPending}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Approuver
                </>
              )}
            </button>

            <button
              onClick={() => completeMutation.mutate(false)}
              disabled={completeMutation.isPending}
              className="w-full py-3 rounded-xl font-bold text-red-400 transition-all flex items-center justify-center gap-2"
              style={{ border: '1px solid var(--border-color)' }}
            >
              <XCircle className="w-5 h-5" />
              Rejeter
            </button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {(verification.status === 'approved' || verification.status === 'rejected') && (
        <div className="card rounded-xl p-6 text-center" style={{ border: '1px solid var(--border-color)' }}>
          {verification.approved ? (
            <>
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>
                Vérification approuvée
              </h3>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-main)' }}>
                Vérification rejetée
              </h3>
              {verification.issues && (
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {verification.issues}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {(acceptMutation.isError || startMutation.isError || completeMutation.isError) && (
        <div className="mt-4 bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
          Une erreur est survenue
        </div>
      )}
    </div>
  );
};

export default VerificationDetail;
