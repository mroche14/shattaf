
import { Product, FAQItem } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'orizon-classic',
    name: 'Oasis Pure Chrome',
    price: 95,
    description: 'L\'élégance de la simplicité. Acier inoxydable poli pour une hygiène chirurgicale et une durabilité sans faille.',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    features: ['Hygiène supérieure au papier', 'Pression hydro-modulable', 'Économie de 80% de papier']
  },
  {
    id: 'orizon-gold',
    name: 'Oasis Royal Gold',
    price: 185,
    description: 'Le summum du raffinement. Finition Or 24k pour transformer votre salle de bain en un véritable spa privé.',
    image: 'https://images.unsplash.com/photo-1620626011761-9963d7521476?q=80&w=800&auto=format&fit=crop',
    features: ['Placage Or prestigieux', 'Jet confort bien-être', 'Garantie à vie Oasis']
  },
  {
    id: 'orizon-black',
    name: 'Oasis Obsidian Mat',
    price: 135,
    description: 'Design contemporain et furtif. Un revêtement mat anti-traces pour une fraîcheur moderne et efficace.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop',
    features: ['Revêtement céramique mat', 'Ergonomie intuitive', 'Réduction des irritations']
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "Pourquoi privilégier l'eau au papier toilette ?",
    answer: "L'hygiène à l'eau est la seule méthode qui nettoie réellement. Le papier déplace les bactéries et irrite la peau. L'eau purifie en douceur, offrant une sensation de bien-être identique à une sortie de douche."
  },
  {
    question: "Est-ce un choix économique en Guadeloupe ?",
    answer: "Absolument. En remplaçant 90% de votre consommation de papier toilette, le Shattaf s'autofinance en quelques mois. C'est un investissement intelligent pour votre budget foyer."
  },
  {
    question: "Offrez-vous des tarifs dégressifs ?",
    answer: "Oui ! Pour les particuliers, nous offrons une remise de 10% sur l'ensemble de la commande à partir de 3 unités. Pour les professionnels (hôtels, résidences), nous proposons des tarifs sur-mesure."
  },
  {
    question: "Proposez-vous des installations pour les hôtels ?",
    answer: "Oasis Shattaf dispose d'une division dédiée aux professionnels. Nous gérons l'installation en volume pour les établissements hôteliers et de santé avec une maintenance prioritaire."
  }
];
