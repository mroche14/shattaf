import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Circle,
  Clock,
  MapPin,
  Calendar,
  Phone,
  Download,
  Loader2,
  FileText,
  User,
  ArrowLeft,
  Droplets,
} from 'lucide-react';

interface PlumberInfo {
  first_name: string;
  phone?: string;
}

interface QuoteInfo {
  id: string;
  installation_price: number;
  total_price: number;
  proposed_date?: string;
  proposed_time_slot?: string;
  plumber_notes?: string;
  status: string;
  plumber?: PlumberInfo;
}

interface JobInfo {
  status: string;
  scheduled_date?: string;
  completed_at?: string;
}

interface InvoiceInfo {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  pdf_url?: string;
}

interface TrackingData {
  id: string;
  status: string;
  status_label: string;
  address_city: string;
  address_postal_code: string;
  created_at: string;
  preferred_date?: string;
  plumber?: PlumberInfo;
  quotes: QuoteInfo[];
  accepted_quote?: QuoteInfo;
  job?: JobInfo;
  invoice?: InvoiceInfo;
}

const statusSteps = [
  { key: 'submitted', label: 'Demande envoyée', icon: FileText },
  { key: 'quoted', label: 'Devis reçu', icon: FileText },
  { key: 'accepted', label: 'Devis accepté', icon: CheckCircle },
  { key: 'scheduled', label: 'RDV confirmé', icon: Calendar },
  { key: 'completed', label: 'Installation terminée', icon: CheckCircle },
];

const getStepIndex = (status: string): number => {
  const index = statusSteps.findIndex((s) => s.key === status);
  if (status === 'in_progress') return 3; // Same as scheduled
  return index >= 0 ? index : 0;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatPrice = (cents: number) => {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
};

const TrackingPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const queryClient = useQueryClient();

  const {
    data: tracking,
    isLoading,
    error,
  } = useQuery<TrackingData>({
    queryKey: ['tracking', bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/public/track/${bookingId}`);
      if (!res.ok) throw new Error('Réservation non trouvée');
      return res.json();
    },
    enabled: !!bookingId,
    refetchInterval: 30000, // Refresh every 30s
  });

  const acceptQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch(`/api/v1/public/track/${bookingId}/accept-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'acceptation du devis');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking', bookingId] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Réservation non trouvée</h1>
          <p className="text-gray-400 mb-6">
            Ce lien n'est pas valide ou a expiré.
          </p>
          <Link to="/" className="text-cyan-400 hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(tracking.status);
  const pendingQuotes = tracking.quotes.filter((q) => q.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">OASIS SHATTAF</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Suivi de votre demande</h1>
          <p className="text-gray-400">
            {tracking.address_postal_code} {tracking.address_city}
          </p>
        </div>

        {/* Status */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Statut actuel</p>
              <p className="text-lg font-bold text-cyan-400">
                {tracking.status_label}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-4">
            {statusSteps.map((step, index) => {
              const isComplete = index <= currentStep;
              const isCurrent = index === currentStep;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isComplete
                        ? isCurrent
                          ? 'bg-cyan-500'
                          : 'bg-cyan-500/30'
                        : 'bg-slate-700'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle
                        className={`w-5 h-5 ${
                          isCurrent ? 'text-white' : 'text-cyan-400'
                        }`}
                      />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <span
                    className={`${
                      isComplete ? 'text-white' : 'text-gray-500'
                    } ${isCurrent ? 'font-bold' : ''}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Quotes */}
        {tracking.status === 'quoted' && pendingQuotes.length > 0 && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Devis reçus
            </h2>
            <div className="space-y-4">
              {pendingQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {quote.plumber?.first_name || 'Plombier certifié'}
                        </p>
                        {quote.proposed_date && (
                          <p className="text-sm text-gray-400">
                            Proposé le {formatDate(quote.proposed_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">
                        {formatPrice(quote.total_price)}
                      </p>
                      <p className="text-xs text-gray-500">TTC</p>
                    </div>
                  </div>
                  {quote.plumber_notes && (
                    <p className="text-sm text-gray-400 mb-4">{quote.plumber_notes}</p>
                  )}
                  <button
                    onClick={() => acceptQuoteMutation.mutate(quote.id)}
                    disabled={acceptQuoteMutation.isPending}
                    className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    {acceptQuoteMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Accepter ce devis
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Quote / Plumber Info */}
        {tracking.accepted_quote && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Votre plombier
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {tracking.accepted_quote.plumber?.first_name?.charAt(0) || 'P'}
                </span>
              </div>
              <div>
                <p className="font-bold text-lg">
                  {tracking.accepted_quote.plumber?.first_name || 'Plombier'}
                </p>
                <p className="text-gray-400">Plombier certifié</p>
              </div>
            </div>
            {tracking.accepted_quote.plumber?.phone && (
              <a
                href={`tel:${tracking.accepted_quote.plumber.phone}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Appeler {tracking.accepted_quote.plumber.phone}
              </a>
            )}
          </div>
        )}

        {/* Scheduled Date */}
        {tracking.job?.scheduled_date && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Rendez-vous
            </h2>
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <p className="text-lg font-bold text-cyan-400">
                {formatDate(tracking.job.scheduled_date)}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Le plombier vous contactera pour confirmer l'heure exacte.
              </p>
            </div>
          </div>
        )}

        {/* Invoice */}
        {tracking.invoice && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Facture
            </h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{tracking.invoice.invoice_number}</p>
                <p className="text-gray-400">
                  {formatPrice(tracking.invoice.total_amount)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  tracking.invoice.status === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {tracking.invoice.status === 'paid' ? 'Payée' : 'En attente'}
              </span>
            </div>
            {tracking.invoice.pdf_url && (
              <a
                href={tracking.invoice.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                <Download className="w-5 h-5" />
                Télécharger la facture
              </a>
            )}
          </div>
        )}

        {/* Help */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-bold mb-3">Besoin d'aide ?</h2>
          <p className="text-gray-400 text-sm mb-4">
            Notre équipe est disponible pour répondre à vos questions.
          </p>
          <a
            href="mailto:contact@orizon-aqua.gp"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <Phone className="w-5 h-5" />
            Nous contacter
          </a>
        </div>
      </main>
    </div>
  );
};

export default TrackingPage;
