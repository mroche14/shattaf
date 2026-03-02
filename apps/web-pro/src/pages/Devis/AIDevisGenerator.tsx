import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Send,
} from 'lucide-react';
import { apiClient } from '../../api/client';

interface LineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  item_type: string;
}

const itemTypeLabels: Record<string, string> = {
  labor: 'Main d\'œuvre',
  material: 'Fourniture',
  travel: 'Déplacement',
};

const AIDevisGenerator: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [vatRate, setVatRate] = useState(0.085);
  const [estimatedDuration, setEstimatedDuration] = useState(60);
  const [confidence, setConfidence] = useState(0);
  const [reasoning, setReasoning] = useState('');
  const [plumberNotes, setPlumberNotes] = useState('');
  const [generated, setGenerated] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const generateDevis = useMutation({
    mutationFn: () => apiClient.quotes.generateAI(bookingId!, plumberNotes || undefined),
    onSuccess: (data) => {
      setLineItems(data.line_items);
      setVatRate(data.vat_rate);
      setEstimatedDuration(data.estimated_duration_minutes);
      setConfidence(data.confidence);
      setReasoning(data.reasoning);
      setGenerated(true);
    },
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  const updateItem = (index: number, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const addItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: 'Nouveau poste', quantity: 1, unit_price_cents: 0, item_type: 'labor' },
    ]);
    setEditingIndex(lineItems.length);
  };

  const handleSendQuote = async () => {
    // Convert the AI devis into a real quote
    const installationPrice = subtotal; // Total before VAT
    navigate(`/missions`); // Navigate back for now — full quote creation flow to be wired
  };

  return (
    <div className="px-4 pb-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
            Devis IA
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Génération assistée par intelligence artificielle
          </p>
        </div>
      </div>

      {/* Notes input */}
      {!generated && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Notes supplémentaires (optionnel)
            </label>
            <textarea
              value={plumberNotes}
              onChange={(e) => setPlumberNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Accès difficile, pièces détachées spécifiques nécessaires..."
              className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
              style={{
                background: 'var(--bg-inner)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
            />
          </div>

          <button
            onClick={() => generateDevis.mutate()}
            disabled={generateDevis.isPending}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {generateDevis.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Générer le devis
              </>
            )}
          </button>

          {generateDevis.isError && (
            <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
              Erreur lors de la génération du devis
            </div>
          )}
        </div>
      )}

      {/* Generated devis */}
      {generated && (
        <div className="space-y-4">
          {/* Confidence indicator */}
          <div className="card rounded-xl p-4" style={{ border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Confiance de l'estimation
              </span>
              <span
                className={`text-sm font-bold ${
                  confidence >= 0.7 ? 'text-emerald-500' : confidence >= 0.4 ? 'text-amber-500' : 'text-red-400'
                }`}
              >
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-inner)' }}>
              <div
                className={`h-full rounded-full transition-all ${
                  confidence >= 0.7 ? 'bg-emerald-500' : confidence >= 0.4 ? 'bg-amber-500' : 'bg-red-400'
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            {reasoning && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                {reasoning}
              </p>
            )}
          </div>

          {/* Line items */}
          <div className="card rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 className="font-medium" style={{ color: 'var(--text-main)' }}>
                Postes du devis
              </h3>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {lineItems.map((item, index) => (
                <div key={index} className="p-4">
                  {editingIndex === index ? (
                    <div className="space-y-3">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        className="w-full rounded-lg px-3 py-2 text-sm"
                        style={{
                          background: 'var(--bg-inner)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                        }}
                      />
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Qté</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                              background: 'var(--bg-inner)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Prix unitaire (€)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={(item.unit_price_cents / 100).toFixed(2)}
                            onChange={(e) => updateItem(index, { unit_price_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                              background: 'var(--bg-inner)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>Type</label>
                          <select
                            value={item.item_type}
                            onChange={(e) => updateItem(index, { item_type: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-sm"
                            style={{
                              background: 'var(--bg-inner)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                            }}
                          >
                            <option value="labor">Main d'œuvre</option>
                            <option value="material">Fourniture</option>
                            <option value="travel">Déplacement</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="flex-1 py-2 rounded-lg text-sm font-medium btn-primary"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="py-2 px-4 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                          {item.description}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {itemTypeLabels[item.item_type] || item.item_type} — {item.quantity}×
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>
                          {((item.unit_price_cents * item.quantity) / 100).toFixed(2)} €
                        </span>
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-cyan-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add item */}
            <button
              onClick={addItem}
              className="w-full p-3 flex items-center justify-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}
            >
              <Plus className="w-4 h-4" />
              Ajouter un poste
            </button>
          </div>

          {/* Totals */}
          <div className="card rounded-xl p-4 space-y-2" style={{ border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Sous-total HT</span>
              <span style={{ color: 'var(--text-main)' }}>{(subtotal / 100).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>TVA ({(vatRate * 100).toFixed(1)}%)</span>
              <span style={{ color: 'var(--text-main)' }}>{(vatAmount / 100).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-main)' }}>Total TTC</span>
              <span className="text-cyan-500">{(total / 100).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span style={{ color: 'var(--text-tertiary)' }}>Durée estimée</span>
              <span style={{ color: 'var(--text-secondary)' }}>{estimatedDuration} min</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSendQuote}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Envoyer le devis
            </button>

            <button
              onClick={() => {
                setGenerated(false);
                setLineItems([]);
              }}
              className="w-full py-3 rounded-xl font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Régénérer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDevisGenerator;
