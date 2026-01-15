export const SITE = {
  brand: {
    name: 'OASIS SHATTAF',
    tagline: 'Shattaf (douchette WC) — Installation 971',
    companyName: 'Orizon Aqua',
  },
  offer: {
    minPriceEUR: 95,
    installationTimeMinutes: 30,
    responseTime: '24h',
    includesInstallation: true,
  },
  contact: {
    email: 'contact@orizon-aqua.gp',
    phoneDisplay: '',
    phoneE164: '',
    whatsappE164: '',
    address: 'Baie-Mahault, Guadeloupe',
    instagramUrl: '',
    facebookUrl: '',
  },
} as const;

export function formatWhatsAppLink(e164: string, message?: string) {
  const digits = e164.replace(/[^\d]/g, '');
  if (!digits) return '';
  const encoded = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${encoded}`;
}

export function formatTelLink(e164: string) {
  const digits = e164.replace(/[^\d+]/g, '');
  if (!digits) return '';
  return `tel:${digits}`;
}

export function isTruthyString(value: string) {
  return Boolean(value && value.trim().length > 0);
}

