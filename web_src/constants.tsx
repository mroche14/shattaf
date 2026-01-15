
import { Product, FAQItem } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'oasis-pure-chrome',
    name: 'Oasis Pure Chrome',
    price: 95,
    description: "L'élégance de la simplicité. Acier inoxydable poli, robuste et agréable au quotidien.",
    image: '/product-chrome.png',
    features: ["Hygiène à l'eau (plus confortable)", 'Pression modulable', 'Réduit fortement le papier (selon usage)']
  },
  {
    id: 'oasis-royal-gold',
    name: 'Oasis Royal Gold',
    price: 185,
    description: 'La touche premium. Finition dorée élégante pour transformer votre salle de bain en spa du quotidien.',
    image: '/product-gold.png',
    features: ['Finition premium', 'Jet confort bien-être', 'Garantie constructeur + SAV local']
  },
  {
    id: 'oasis-obsidian-mat',
    name: 'Oasis Obsidian Mat',
    price: 135,
    description: 'Design contemporain et furtif. Un revêtement mat anti-traces pour une fraîcheur moderne et efficace.',
    image: '/product-black.png',
    features: ['Revêtement mat anti-traces', 'Ergonomie intuitive', 'Moins de frottement = plus de confort']
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "Pourquoi privilégier l'eau au papier toilette ?",
    answer: "Le papier essuie, l'eau nettoie. Le shattaf rince en douceur, puis vous séchez avec quelques feuilles : résultat plus propre, plus confortable, et une vraie sensation de fraîcheur."
  },
  {
    question: "Est-ce un choix économique en Guadeloupe ?",
    answer: "Oui, en général. Vous utilisez nettement moins de papier (selon habitudes), ce qui réduit les achats récurrents et le stockage à la maison."
  },
  {
    question: "Est-ce compatible avec mon WC ?",
    answer: "Dans la majorité des cas, oui : WC standard + arrivée d'eau avec robinet d'arrêt. Avant l'intervention, on confirme avec vous la configuration."
  },
  {
    question: "L'installation est-elle incluse ? Et ça prend combien de temps ?",
    answer: "Notre service est pensé “clé en main”. En général, l'installation se fait rapidement (souvent ~30 minutes) et sans gros travaux."
  },
  {
    question: "Est-ce que ça met de l'eau partout ?",
    answer: "Non : la pression est modulable et l'usage est simple. On vous montre le bon geste : rinçage + séchage rapide."
  },
  {
    question: "Et le calcaire en Guadeloupe ?",
    answer: "On sélectionne des modèles robustes et faciles d'entretien. Un nettoyage simple régulier suffit, et on vous donne les bonnes pratiques."
  },
  {
    question: "Y a-t-il un risque de fuite ?",
    answer: "Comme toute installation plomberie, ça se joue sur la qualité des raccords et de la pose. On installe proprement, on teste sur place, et vous avez un support local en cas de besoin."
  },
  {
    question: "Comment se passe la réservation ?",
    answer: "Vous remplissez le formulaire, on confirme le créneau et les détails (adresse, accès, modèle), puis on intervient à la date convenue."
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "Selon la configuration, nous proposons paiement sur place ou lien sécurisé. Les modalités exactes sont confirmées lors de la validation du créneau."
  },
  {
    question: "Offrez-vous des tarifs dégressifs ?",
    answer: "Oui ! Pour les particuliers, nous offrons une remise de 10% sur l'ensemble de la commande à partir de 3 unités. Pour les professionnels (hôtels, résidences), nous proposons des tarifs sur-mesure."
  },
  {
    question: "Proposez-vous des installations pour les hôtels ?",
    answer: "Oui. Nous gérons l'installation en volume (hôtels, villas, résidences, Airbnb) avec tarification dégressive et organisation adaptée (planning, maintenance, support)."
  }
];
