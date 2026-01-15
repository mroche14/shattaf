# Étude complète — ce qui fait convertir une landing page (audit + recommandations)

Date : **2026-01-15**  
Repo : `/home/marvin/Projects/shattaf` — commit **ecbb3da**  
Périmètre audité : landing page React (Vite) dans `web_src/` (`web_src/App.tsx`, `web_src/components/*`)  
Objectif : expliquer **les leviers universels de conversion** + livrer une **liste priorisée de modifications** applicables à la landing “Oasis Shattaf” (Guadeloupe).

> Note importante : ce rapport est une **analyse heuristique** (basée sur le contenu + l’UX visibles dans le code). Les meilleures décisions se valident ensuite par **mesure** (tracking) et **tests A/B**.

---

## 0) Résumé exécutif (si tu ne lis qu’une page)

Les gains de conversion les plus probables pour la landing actuelle (sans même toucher au design) :

1) **Clarifier la promesse “au-dessus de la ligne de flottaison”** : dire explicitement *ce que c’est* (douchette WC/shattaf), *pour qui* (Guadeloupe), *ce qui est inclus* (installation), *à partir de quel prix*, et *le prochain pas* (réserver / devis / paiement).  
2) **Réparer les “fuites de confiance”** : cohérence de marque (“Oasis Shattaf” vs “Orizon Aqua”), liens sociaux `#`, téléphone “XX”, newsletter non branchée, CTA “Valider & Payer” sans paiement réel.  
3) **Remplacer les chiffres/claims non sourcés** par une formulation crédible + éventuellement des sources internes (voir `docs/shattaf_papier_toilette_extraction_exhaustive.md`). Les claims extrêmes (“100%”, “propreté clinique”, “~50 feuilles/session”) **tuent** la crédibilité si l’utilisateur est sceptique.  
4) **Réduire la friction du formulaire** : demander moins (ou rendre optionnel) tant que la personne n’a pas “buy-in”, proposer WhatsApp/téléphone, expliciter “ce qui se passe après” (confirmation, créneau, paiement).  
5) **Instrumenter** : sans analytics + événements (CTA, scroll, abandon formulaire), tu optimises “à l’aveugle”.

---

## 0.c) Mise en œuvre (appliqué dans ce repo)

Les recommandations “conversion” ci-dessus ont été **appliquées** directement dans `web_src/` :
- Cohérence + confiance : config centralisée `web_src/siteConfig.ts`, suppression des liens/contacts factices dans le footer (`web_src/App.tsx`).  
- Hero : H1 explicite “douchette WC (shattaf)”, ancrage prix, preuves (971/30min/24h), CTA clarifiés (`web_src/components/Hero.tsx`).  
- Claims : suppression des absolus et chiffres invérifiables, reformulation plus crédible (`web_src/components/Philosophy.tsx`, `web_src/components/HygieneDuel.tsx`, `web_src/constants.tsx`).  
- Offre : IDs produits cohérents + features plus prudentes, ajout “installation incluse” visuelle (`web_src/constants.tsx`, `web_src/components/ProductGrid.tsx`).  
- Booking : friction réduite (date optionnelle, email optionnel), CTA aligné (plus de “payer”), et envoi **réel** via WhatsApp (si configuré) ou `mailto:` (`web_src/components/BookingSection.tsx`).  
- Typo/couleurs : tailles mini remontées (8–10px → 11px), tracking réduit, contraste augmenté (plus lisible).  
- Performance : Tailwind compilé (suppression CDN), styles centralisés dans `web_src/index.css`, build validé (`npm run build`).  

À faire côté business : renseigner `SITE.contact.*` dans `web_src/siteConfig.ts` (WhatsApp/Instagram/Facebook/téléphone) pour activer ces canaux.

---

## 0.b) Hypothèses (à valider pour éviter de “designer dans le vide”)

Ces recommandations partent des hypothèses suivantes (si une hypothèse est fausse, je propose une variante plus bas) :
- Conversion visée : **lead qualifié** (prise de RDV / devis) plutôt que paiement immédiat (actuellement “paiement” simulé).  
- Marché : Guadeloupe (971), audiences principales : **particuliers** (confort/hygiène) + **hébergement pro** (Airbnb/hôtel/villa).  
- Positionnement : **premium accessible** (design luxe, mais promesse concrète : installation simple, gain quotidien).  
- Frictions clés : “est-ce compatible ?”, “ça fuit ?”, “le calcaire ?”, “qui installe ?”, “combien tout compris ?”, “comment je vous contacte ?”.  

Si tu me confirmes le **canal d’acquisition** (Meta ads ? Google ? SEO ?) et le **mode de paiement** réel (sur place, lien Stripe, etc.), on peut affiner la hiérarchie CTA au millimètre.

---

## 1) Ce qui fait vraiment convertir une landing page (modèle mental)

Une landing convertit quand elle résout simultanément 5 équations :

### 1.1 Message-match (trafic → promesse → page)
Le visiteur doit sentir en **3–5 secondes** : “je suis au bon endroit”.  
Si tes pubs/SEO parlent “installation shattaf Guadeloupe”, la page doit le refléter **dans le H1 + sous-titre + visuel**.

### 1.2 Valeur perçue > coût perçu
La conversion est un arbitrage : *bénéfice attendu* − *risques* − *efforts*.  
On augmente la valeur (bénéfices, preuves, différenciation, offre) et on baisse les coûts (friction, anxiété, ambiguïté).

### 1.3 Clarté > persuasion
La plupart des landing pages échouent par **flou**, pas par manque de design.  
Les questions à lever tôt :
- C’est quoi exactement ?
- Pour qui ?
- Qu’est-ce qui est inclus ?
- Combien ça coûte / comment on paye ?
- Qu’est-ce qui se passe après ?

### 1.4 Confiance (la variable “invisible”)
La conversion est une transaction de confiance. Une seule incohérence peut ruiner tout le reste (ex. : téléphone fictif, liens morts, claims trop parfaits).

### 1.5 Friction minimale sur l’action demandée
Chaque champ, chaque clic, chaque hésitation coûte des conversions.  
En pratique : **1 objectif par page** + **1 CTA primaire** + une “sortie de secours” (WhatsApp / appel) pour ceux qui ne veulent pas remplir un formulaire.

---

## 2) Les leviers universels (checklist “haute conversion”)

### 2.1 Proposition de valeur (au-dessus de la ligne de flottaison)
À viser :
- Un **H1** explicite (quoi + bénéfice)  
- Un **sous-titre** qui précise (pour qui + contexte + différenciation)  
- 3 **preuves rapides** (ex. : “installation incluse”, “SAV local”, “garantie”)  
- 1 **CTA primaire** (action unique) + 1 **CTA secondaire** (apprendre / comparer)

### 2.2 Offre (ce que tu vends vraiment)
Une “bonne page” ne compense pas une offre floue.
Clarifie :
- Produit vs service (ici : **produit + installation**)
- Prix (et ce qu’il inclut : déplacement, pose, garantie, maintenance ?)
- Options (particulier vs pro, volume)
- Risque (garantie, satisfaction, SAV)

### 2.3 Preuve & réassurance
Formes de preuve (du plus fort au plus faible) :
1) Démo/vidéo réelle + photos d’installations locales  
2) Avis clients vérifiables (Google, Facebook)  
3) Chiffres sourcés (études, méthodes, fourchettes)  
4) Logos/partenaires/certifications (si vrai)  
5) “Claim marketing” (le moins fort)

### 2.4 UX & micro-copy (les détails qui font “oui”)
- CTA explicite (“Réserver une installation”, “Demander un devis”, “Être rappelé”)  
- Micro-copy rassurante sous CTA (“Réponse < 24h”, “Paiement sur place”, “Sans engagement”)  
- Sections dans l’ordre du cerveau : **compréhension → preuve → offre → action**

### 2.5 Formulaire / checkout
Bonnes pratiques :
- Demander le strict minimum pour démarrer  
- Rendre les champs “engageants” **optionnels** au début (ex : date souhaitée)  
- Donner un “next step” clair : confirmation, appel, paiement  
- Offrir un canal alternatif (WhatsApp / appel)

### 2.6 Technique : vitesse, mobile, fiabilité
Une landing qui charge lentement “convertit moins”, même si elle est belle.  
À surveiller (Core Web Vitals) : **LCP**, **INP**, **CLS**, poids images, polices, scripts tiers.

### 2.7 Mesure : une optimisation sans données = intuition
Minimum viable :
- 1 outil analytics (GA4, Plausible, Matomo…)  
- événements : clic CTA, scroll 25/50/75, début formulaire, soumission, erreurs  
- cohorte par source (ads, organic, social)

---

## 3) Audit de la landing actuelle (Oasis Shattaf — `web_src/`)

### 3.1 Structure actuelle (parcours)
- `web_src/components/Hero.tsx` : promesse “eau > papier”, CTA vers réservation, visuels génériques (Dubaï/Guadeloupe), 1 citation.  
- `web_src/components/Philosophy.tsx` : “virage culturel”, bénéfices, chiffres (98%, -80%).  
- `web_src/components/HygieneDuel.tsx` : comparaison papier vs shattaf avec chiffres (“~50 feuilles”, “2–3 feuilles”) + claims forts (“100%”).  
- `web_src/components/ProductGrid.tsx` + `web_src/constants.tsx` : 3 modèles, prix, features, CTA vers réservation.  
- `web_src/components/BusinessSection.tsx` : segment pro + CTA “devis pro”.  
- `web_src/components/BookingSection.tsx` : “Particulier/Pro” + formulaire + total estimé + CTA “Valider & Payer” / “Demander le devis” (mais soumission simulée).  
- `web_src/components/FAQ.tsx` : 4 questions.  
- `web_src/components/ChatConsultant.tsx` + `web_src/services/geminiService.ts` : chat IA (Gemini).  
- `web_src/App.tsx` : footer (contact, newsletter, liens sociaux).

### 3.2 Points forts (à conserver)
- Design premium cohérent (glass + gradients) et hiérarchie visuelle forte.  
- CTA vers une section unique (`#booking`) : c’est sain pour le focus.  
- Présence de “segmentation” pro/particulier (déjà un bon réflexe).  
- Produit packagé en “modèles” (rend l’offre tangible).

### 3.3 Freins majeurs à la conversion (priorité haute)

#### A) Incohérences de confiance (brand, liens, promesses)
- Marque : “Oasis Shattaf” (header/hero) vs “ORIZON AQUA” (footer, ids produits) (`web_src/App.tsx`, `web_src/constants.tsx`).  
- Liens sociaux `href="#"` et numéro de téléphone placeholder “+590 690 XX XX XX” (`web_src/App.tsx`).  
- Newsletter sans backend (champ email + bouton “OK” sans action) (`web_src/App.tsx`).  

> Impact conversion : très élevé. Beaucoup d’utilisateurs interprètent ça comme “site pas fini” → abandon.

#### B) CTA/checkout trompeur (perception de risque)
- Le bouton dit **“Valider & Payer”**, mais la soumission est simulée (setTimeout 2s) (`web_src/components/BookingSection.tsx`).  

> Impact conversion : très élevé. Les visiteurs tolèrent un “demander un devis” sans paiement ; ils tolèrent beaucoup moins une promesse de paiement qui ne ressemble pas à un vrai paiement.

#### C) Claims trop absolus / chiffres invérifiables
- “100% des impuretés”, “propreté clinique”, “~50 feuilles/session”, “98% satisfaction” sans preuve visible (`web_src/components/Philosophy.tsx`, `web_src/components/HygieneDuel.tsx`).  

> Impact conversion : élevé (surtout sur les profils sceptiques, pro, ou “comparateurs”).

### 3.4 Freins secondaires (opportunités)
- Au-dessus de la ligne de flottaison : le H1 ne dit pas “douchette WC + installation en Guadeloupe”.  
- Visuels : beaucoup d’images “lifestyle” et peu de produit/installation réelle → manque d’authenticité.  
- FAQ trop courte : manque d’objections clés (compatibilité, pression, fuites, calcaire, hygiène/anti-retour, entretien, paiement, délais).  
- Chat IA : utile potentiellement, mais pose des questions de **privacy** (données envoyées à un tiers) et peut distraire (à tester).

---

## 4) Recommandations de modifications (priorisées, actionnables)

> L’idée : d’abord **lever les doutes** (trust), puis **réduire la friction**, puis **augmenter la valeur perçue**.

### P0 — À faire avant d’envoyer du trafic payant (impact maximal)

1) **Aligner la promesse et l’action**
   - Décider : la conversion est-elle un **paiement en ligne** ou une **prise de RDV / demande de devis** ?
   - Si pas de paiement réel : remplacer “Valider & Payer” par “Réserver”, “Demander un rappel”, “Demander un devis” et expliquer le step suivant (confirmation + modalités).
   - Fichiers : `web_src/components/BookingSection.tsx`, `web_src/components/Hero.tsx`, `web_src/components/Header.tsx`.

2) **Réparer les signaux de confiance “cassés”**
   - Remplacer téléphone placeholder + liens sociaux `#` par des vrais liens, ou retirer (mieux vaut rien que faux).
   - Soit brancher la newsletter (même simple), soit la retirer tant qu’elle ne fonctionne pas.
   - Fichier : `web_src/App.tsx`.

3) **Unifier la marque / nomenclature**
   - Clarifier : “Orizon Aqua” = société, “Oasis Shattaf” = gamme ? (si oui, l’expliquer 1 fois).  
   - Garder **un seul nom dominant** partout (header, footer, email, chat).
   - Fichiers : `web_src/components/Header.tsx`, `web_src/App.tsx`, `web_src/constants.tsx`, `web_src/services/geminiService.ts`.

4) **Nettoyer les claims**
   - Remplacer les absolus (“100%”) par des formulations crédibles (“nettoie plus efficacement”, “réduit fortement…”, “souvent…”) + fourchettes.
   - Pour l’argument papier : s’appuyer sur la fourchette et les sources déjà compilées dans `docs/shattaf_papier_toilette_extraction_exhaustive.md` (ex : “~10 à ~19 feuilles économisées par grosse commission”, plutôt que “~50 feuilles/session”).
   - Fichiers : `web_src/components/HygieneDuel.tsx`, `web_src/components/Philosophy.tsx`, `web_src/constants.tsx`.

### P1 — Quick wins (1–2 jours)

5) **Rendre le “above the fold” explicite**
   - Ajouter un sous-titre qui dit : “Douchette WC (shattaf) + installation en Guadeloupe” + une promesse claire (hygiène, confort, moins de papier).
   - Ajouter une preuve courte : “Installation en ~30 min”, “Intervention 971”, “SAV local / garantie”.
   - Fichier : `web_src/components/Hero.tsx`.

6) **Ajouter un canal de conversion “instantané”**
   - Bouton WhatsApp (très adapté au contexte local) + click-to-call sur mobile.
   - Position : header (mobile) + section booking + footer.
   - Fichiers : `web_src/components/Header.tsx`, `web_src/components/BookingSection.tsx`, `web_src/App.tsx`.

7) **Expliquer le process en 3 étapes**
   - Une section courte : “1) Choisissez le modèle 2) On confirme le créneau 3) Installation”.
   - But : réduire l’anxiété “comment ça se passe”.
   - Fichiers : nouveau composant ou intégration dans `web_src/components/BookingSection.tsx`.

8) **Preuve locale**
   - Remplacer au moins 1 visuel hero par une photo réelle du produit/installation (même smartphone) : ça convertit souvent mieux que du stock “parfait”.
   - Fichiers : `web_src/components/Hero.tsx`, `web_src/constants.tsx`.

### P2 — Structure & profondeur (1–2 semaines)

9) **Séparer B2C et B2B**
   - Option A : 2 pages (plus propre).  
   - Option B : une landing unique mais CTA pro qui ouvre directement le mode “Pro” dans `BookingSection`.
   - Fichiers : `web_src/components/BusinessSection.tsx`, `web_src/components/BookingSection.tsx`.

10) **Étendre la FAQ (objections réelles)**
   - Ajouter : compatibilité, fuite/anti-retour, calcaire/entretien, pression, hygiène (buse), paiement, délais, SAV, garanties, “ça mouille partout ?”, enfants/seniors.
   - Fichier : `web_src/constants.tsx` + rendu `web_src/components/FAQ.tsx`.

11) **Pages “trust” minimales**
   - Mentions légales, politique de confidentialité, RGPD/cookies (surtout si chat IA + tracking).
   - Techniquement : même en SPA, prévoir des routes ou pages statiques.

### P3 — Mesure et optimisation continue

12) **Instrumenter la page**
   - Événements : clic CTA (header/hero/product/business), ouverture chat, scroll depth, focus formulaire, abandon, submit.
   - Sans ça, impossible de prioriser correctement.

13) **Backlog de tests A/B (hypothèses)**
   - H1 explicite (“Installation shattaf en Guadeloupe”) vs H1 aspirationnel (“L’eau…”).  
   - Visuel produit réel vs lifestyle.  
   - CTA “Réserver installation” vs “Être rappelé”.  
   - Formulaire long vs capture lead courte (nom + téléphone) puis scheduling.

---

## 5) Proposition de copy (exemples concrets)

### Option H1 (clarté maximale)
**“Douchette WC (Shattaf) + installation en Guadeloupe.”**  
Sous-titre : “Hygiène à l’eau, confort immédiat, moins de papier. Intervention 971, installation rapide.”

### Option H1 (premium + concret)
**“L’hygiène à l’eau, version premium — installée chez vous en Guadeloupe.”**  
Sous-titre : “Choisissez votre modèle, on s’occupe du reste. SAV local, conseil avant installation.”

### Micro-copy sous le CTA principal
- “Confirmation sous 24h — créneau ajustable”  
- “Paiement sur place / lien sécurisé (selon choix)”  
- “Sans engagement si vous demandez un devis”

---

## 6) Plan de mesure (KPI + événements)

### 6.1 KPI principaux (selon objectif)
- Objectif “lead” : taux de soumission formulaire, taux WhatsApp/call, coût par lead, taux de RDV honorés.
- Objectif “achat” : taux checkout, panier moyen, taux d’abandon, délai de conversion.

### 6.2 Événements à tracker (minimum)
- `cta_click` (source: hero/header/product/business/footer)  
- `booking_view` (section visible)  
- `booking_start` (premier champ focus)  
- `booking_submit_success` / `booking_submit_error`  
- `whatsapp_click`, `phone_click`  
- `chat_open`, `chat_message_sent`

---

## 7) Annexes — points spécifiques au code actuel

### 7.1 “Valider & Payer” sans paiement
Repère : `web_src/components/BookingSection.tsx` (fonction `handleSubmit`).  
Action : aligner le wording avec le vrai comportement (lead vs paiement), sinon perte de confiance.

### 7.2 Claims et chiffres
Repères :
- `web_src/components/HygieneDuel.tsx` (“~50 feuilles”, “100%”)  
- `web_src/components/Philosophy.tsx` (“98% satisfaction”, “propreté clinique”)  
- `web_src/constants.tsx` (features “Garantie à vie”, etc.)

Action : reformuler en **fourchettes** + **preuve** (au minimum “selon nos retours”, “selon études”, ou lien vers un bloc “Sources”).

### 7.3 Signaux “site pas fini”
Repère : `web_src/App.tsx` (liens `#`, téléphone placeholder, newsletter).  
Action : corriger/retirer avant acquisition payante.

---

## 8) Typographie (polices, tailles, lisibilité) — recommandations concrètes

### 8.1 Ce que tu as actuellement (et ce que ça communique)
Repère : `web_src/index.html`.
- Police texte : **Plus Jakarta Sans** (moderne, “tech premium”, très OK pour conversion).  
- Police display : **Space Grotesk** (impact, “premium contemporain”, très OK pour H1/H2).  
- Direction artistique : dark + glass + uppercase + tracking large → “luxe/tech”.

Le problème n’est pas le choix des polices, c’est **l’excès de micro-typo** :
- Beaucoup de textes en **8–10px** + uppercase + tracking large (`text-[8px]`, `text-[10px]`, `tracking-[0.25em]`, etc.).  
- Sur mobile, ça passe de “premium” à “illisible” → donc perte de compréhension → donc perte de conversion.

### 8.2 Règles simples qui augmentent la conversion (sans casser le style)
1) **Body** : 16px minimum sur mobile (c’est le standard “lisible sans effort”).  
2) **Micro-copy** : jamais en dessous de 12px si elle porte une info utile (prix, conditions, réassurance).  
3) **Uppercase** : réserver aux “labels” (petits titres), pas aux phrases importantes.  
4) **Tracking** : sur petites tailles, réduire (sinon lecture lettre-par-lettre).  
5) **Contraste + taille** : si tu gardes du texte très petit, il doit être **plus clair** (ex : `text-slate-300` plutôt que `text-gray-500`).

### 8.3 Type scale recommandé (compatible avec ton design)
But : conserver “luxe” tout en augmentant la compréhension.
- H1 : 56–72 (mobile) / 80–96 (desktop) — déjà proche de ton actuel.  
- H2 : 36–48  
- H3 : 28–32  
- Body : 16–18  
- Secondary text : 14–16  
- Labels (uppercase) : 11–12 (max), tracking 0.12–0.2em  

### 8.4 Changements typographiques ultra ciblés (là où ça coûte des conversions)
Repères dans le code :
- `web_src/components/Hero.tsx` : badges `text-[8px]` / `text-[10px]` → passer en `text-[11px]`/`text-xs` + réduire tracking.  
- `web_src/components/Header.tsx` : tagline `text-[8px]` → passer à `text-[11px]`.  
- `web_src/components/BookingSection.tsx` : labels `text-[10px]` ok, mais les warnings `text-[9px]` + `text-gray-600` trop faible → augmenter taille/contraste.  
- `web_src/App.tsx` : footer text très petit (`text-[10px]`) ok si contraste suffisant.

---

## 9) Couleurs (psychologie, contraste, hiérarchie) — recommandations concrètes

### 9.1 Ce que ta palette raconte aujourd’hui
Repère : `web_src/index.html` (styles).
- Fond : `#020617` (bleu nuit) → premium, sérieux.  
- Accent primaire : cyan/bleu (`#06b6d4` → `#3b82f6`) → techno, frais, hygiène, eau.  
- Accent premium : or (`#BF953F` → `#FCF6BA` → `#AA771C`) → luxe.  
- Glass surfaces : `rgba(15, 23, 42, 0.7)` → modernité.

Psychologiquement : c’est cohérent avec “luxe + hygiène + eau”.

### 9.2 Le piège principal : contraste “trop low” sur petits textes
Tu utilises souvent des gris (ex : `text-gray-500`) sur fond très sombre + taille 8–10px.  
Résultat : faible lisibilité → le cerveau “fatigue” → il scrolle sans comprendre → conversion baisse.

### 9.3 Hiérarchie couleur recommandée (simple, efficace)
1) **1 couleur d’action** (CTA principal) : garder cyan/bleu, mais l’utiliser **exclusivement** pour les actions primaires.  
2) **1 couleur premium** (or) : ne l’utiliser que pour “prix”, “top confort”, “offre”, “garantie” (sinon ça devient du bruit).  
3) **1 couleur “danger/objection”** : ton rouge dans `HygieneDuel` marche, mais attention au ton (voir section psychologie).  
4) **Neutrals** : remonter la luminosité des textes secondaires (ex : viser un gris plus clair).

### 9.4 Tokens (pour une cohérence “conversion-friendly”)
Même si tu restes en Tailwind CDN, pense en “tokens” :
- Background : `#020617`  
- Surface : `rgba(15,23,42,0.75)`  
- Text primary : `#F8FAFC`  
- Text secondary (lisible) : `#CBD5E1`  
- Text muted (vraiment secondaire) : `#94A3B8`  
- Primary CTA : `#06B6D4` → `#3B82F6`  
- Premium accent : or (ton gradient actuel)  
- WhatsApp (si ajouté) : vert dédié (à part) pour signifier “contact rapide”

---

## 10) Copywriting & psychologie (ce qui pousse à dire “oui”)

### 10.1 Ton actuel : très “assertif / rupture culturelle”
Forces :
- Tu assumes un positionnement fort (“eau > papier”).  
Risques :
- Certaines personnes peuvent ressentir du **jugement** (shame) → résistance → “je ferme”.

Recommandation : garder la rupture, mais en la formulant comme un **upgrade** (fierté + confort), pas comme une accusation.

### 10.2 Les déclencheurs psychologiques à utiliser (sans manipuler)
1) **Clarté** (réduction incertitude) : “compatible”, “installé en 30 min”, “971”.  
2) **Réduction du risque** : “garantie fuite”, “SAV local”, “paiement sur place / lien sécurisé”.  
3) **Preuve** : photos d’installations, avis, nombre d’installations (si vrai).  
4) **Projection** : “la sensation douche” (tu l’as déjà) + scénarios concrets (matin pressé, chaleur, enfants).  
5) **Effort minimal** : “tu cliques, on installe”.  
6) **Identité** : “standard international”, “upgrade premium discret”.

### 10.3 Framework recommandé pour ta page (ordre des sections)
Pour maximiser la conversion, l’ordre mental classique :
1) **C’est quoi + bénéfice immédiat** (Hero)  
2) **Pourquoi ça marche / mécanisme** (explication simple)  
3) **Preuves** (visuel réel + avis)  
4) **Offre** (modèles + ce qui est inclus)  
5) **Réassurance** (compatibilité, garantie, process)  
6) **Action** (booking)  
7) **Objections** (FAQ)

Ton site est proche, mais il manque surtout : **preuve locale** + **process** + **réassurance “tech/plomberie/calcaire”**.

---

## 11) Wording recommandé (section par section) — propositions prêtes à coller

> Objectif : garder le style premium, mais augmenter la compréhension + la confiance + la “convertibilité”.

### 11.1 Header (`web_src/components/Header.tsx`)
Navigation :
- Remplacer “L’Hygiène” par “Pourquoi l’eau” (plus concret).  
- Ajouter un lien “Pro” vers `#business`.  
CTA header :
- “Commander” → si pas de paiement immédiat, préférer “Réserver” / “Demander un devis”.

Tagline :
- “Douchette Hygiénique” → “Shattaf (douchette WC) — Installation 971”

### 11.2 Hero (`web_src/components/Hero.tsx`)
H1 (clarté + premium) :
- Variante A (directe) : “Douchette WC (Shattaf) + installation en Guadeloupe.”  
- Variante B (premium) : “L’hygiène à l’eau, version premium — installée chez vous en Guadeloupe.”

Sous-titre (à ajouter/adapter) :
- “Choisissez votre modèle. On installe chez vous en ~30 min. Moins de papier, plus de confort.”

Badges preuve (à mettre sous le CTA ou près du H1) :
- “Intervention 971”  
- “Installation incluse”  
- “SAV local”

CTA principal :
- “Réserver mon installation” ok.  
Micro-copy sous CTA :
- “Confirmation sous 24h — créneau ajustable”

CTA secondaire :
- “Voir les modèles” (au lieu de “Pourquoi l’eau ?” si tu veux orienter vers l’offre rapidement).  

Visuels :
- Remplacer au moins 1 image stock par **photo réelle produit/installation** (même imparfaite) : meilleure confiance.

### 11.3 Philosophy (`web_src/components/Philosophy.tsx`)
Nettoyage des claims :
- “propreté clinique” → “propreté nettement supérieure au papier seul”  
- “Le papier étale les bactéries” → formulation plus prudente : “Le papier essuie mais ne nettoie pas” (tu évites le débat scientifique).

Chiffres :
- “98% satisfaction” et “-80% déchets papier” : si tu n’as pas la source, remplacer par :
  - “Retours clients très positifs”  
  - “Réduction importante de papier (selon usage)”

### 11.4 Hygiene Duel (`web_src/components/HygieneDuel.tsx`)
Ton :
- “Méthode Arcaïque” peut être clivant. Variante plus “classe” : “Papier seul” vs “Hygiène à l’eau”.

Chiffres :
- “~50 feuilles/session” : à remplacer par une **fourchette crédible** (voir `docs/shattaf_papier_toilette_extraction_exhaustive.md`) :
  - Papier seul : “~14–21 feuilles (selon habitudes)”  
  - Shattaf : “~2–4 feuilles (séchage)”

Claims :
- “100% des impuretés” → “nettoie en profondeur, sans friction” (sans absolu).

### 11.5 Product grid (`web_src/components/ProductGrid.tsx`, `web_src/constants.tsx`)
Clarifier “ce qui est inclus” :
- Sous le prix ou sous le bouton : “Prix inclut installation 971” (si vrai).  
Renforcer différenciation :
- Ajouter 1 ligne “Pourquoi nous vs Amazon” : “anti-calcaire”, “anti-retour”, “pose + SAV”.

CTA :
- “Choisir ce modèle” ok, microcopy sous bouton : “On vous rappelle pour confirmer”.

### 11.6 Business section (`web_src/components/BusinessSection.tsx`)
CTA :
- “Demander un devis Pro” ok, ajouter microcopy : “Réponse < 24h — tarifs dégressifs”.

Preuve :
- Ajouter 1 mini-case (si dispo) : “Villa X — 8 unités installées”.

### 11.7 Booking (`web_src/components/BookingSection.tsx`)
Renommer le bouton :
- Particulier : “Réserver / Être rappelé” (au lieu de “Valider & Payer” si pas de paiement).  
- Pro : “Demander un devis”.

Réduire la friction :
- Rendre “date souhaitée” optionnelle (ou “préférence”), et confirmer ensuite par WhatsApp/téléphone.  
- Ajouter champ téléphone/WhatsApp (sinon tu perds des leads “mobile-first”).  

Réassurance juste sous le bouton :
- “Confirmation sous 24h”  
- “Paiement sur place / lien sécurisé” (selon réel)  
- “Sans engagement (devis)”

### 11.8 FAQ (`web_src/constants.tsx`, `web_src/components/FAQ.tsx`)
Ajouter les objections qui bloquent vraiment :
- Compatibilité (WC standard, arrivée d’eau)  
- Anti-retour / hygiène  
- Fuites / garantie  
- Calcaire (Guadeloupe) + entretien  
- Pression + réglage  
- “Est-ce que ça met de l’eau partout ?”  
- Paiement + délais + SAV

### 11.9 Footer (`web_src/App.tsx`)
Supprimer tout ce qui fait “site fake” :
- Liens sociaux `#` → vrais liens ou supprimer.  
- Téléphone “XX” → vrai ou supprimer.  
- Newsletter non branchée → supprimer ou connecter.

---

## 12) UI/UX (layout, composants, micro-interactions) — recommandations

### 12.1 Règle d’or : une seule action principale
Tout doit pointer vers **une action** :
- B2C : “Réserver / être rappelé”  
- B2B : “Demander devis”

### 12.2 Ajouts qui convertissent (sans alourdir)
1) Bloc “Process 3 étapes” juste avant le formulaire.  
2) Bloc “Compatibilité” (2–3 lignes + pictos).  
3) Bloc “Garantie / SAV” (simple, factuel).  
4) Bouton WhatsApp sticky (mobile) si tu fais du lead.

### 12.3 Réduire la distraction du chat IA
Le chat IA peut aider… mais peut aussi :
- détourner du CTA  
- créer des réponses incohérentes  
- poser un problème privacy

Recommandation : le déclencher **après** interaction (scroll/temps) ou le transformer en “FAQ dynamique”.

---

## 13) Technique (performance, SEO, tracking, confiance)

### 13.1 Performance
Points à surveiller :
- Images Unsplash lourdes (LCP).  
- Tailwind CDN (poids) vs build (optimal).  
- Polices Google (preconnect, `display=swap`).

### 13.2 SEO & partage
Ajouter :
- meta description (claire, locale)  
- OpenGraph/Twitter cards  
- titres H1/H2 sémantiques (déjà globalement OK)

### 13.3 Confiance légale (surtout si chat/track)
Prévoir :
- politique de confidentialité  
- mentions légales  
- consentement tracking si nécessaire

---

## 14) “Liste de modifs” concrète (par priorité, par fichier)

### P0 (stop-the-bleeding)
- `web_src/components/BookingSection.tsx` : remplacer wording “payer” si pas de paiement, réduire friction, ajouter téléphone/WhatsApp, expliquer next step.  
- `web_src/App.tsx` : enlever/brancher liens et éléments “fake”.  
- `web_src/components/HygieneDuel.tsx` + `web_src/components/Philosophy.tsx` : retirer absolus, remplacer par fourchettes + prudence.

### P1 (quick wins)
- `web_src/components/Hero.tsx` : H1 explicite + preuves + microcopy, visuel réel.  
- `web_src/constants.tsx` + `web_src/components/FAQ.tsx` : FAQ complète (objections).

### P2 (preuve + structure)
- Ajouter section “Avis / installations” (nouveau composant).  
- Ajout mini-pages légales.
