# 12 — UGC Cashback (Oasis Shattaf) — Spécification
**Version :** v1.1 (draft)  
**Date :** 25/01/2026  
**Zone :** Guadeloupe / France (droit français)  

> Objectif : mettre en place un programme UGC (“contenu utilisateur”) où un Client est remboursé (ex. **20 €**) s’il publie un contenu conforme (X / Instagram / Facebook) mentionnant Oasis Shattaf, après installation.  
> Modèle de paiement retenu : **Option 1 = refund Stripe** (remboursement partiel sur le paiement d’origine).  
> ⚠️ À valider avec juriste (droit conso / influence / publicité) + expert‑comptable (TVA / compta). Sources : voir `11_SOURCES.md`.

---

## 1) Principe (Option 1 — cashback via Stripe refund)
### 1.1 Pourquoi “refund” (au lieu de payer l’influenceur)
- Pas de KYC/onboarding payout : on rembourse **le client** sur son moyen de paiement d’origine.
- Mise en place simple : un seul flux Stripe (PaymentIntent → capture → refund partiel).
- Le cashback est comptabilisé comme un **coût marketing** (à tracer).

### 1.2 Pré‑conditions
- Le Client a payé via Stripe (carte / moyen compatible refunds).
- Le paiement est **capturé** (pas seulement autorisé).
- On a le `stripe_payment_intent_id` associé à la commande.
- Le programme s’applique uniquement aux commandes “éligibles” (ex : installation terminée + validée).

---

## 2) Règles business (MVP)
### 2.1 Paramètres
- `CASHBACK_TIERS` : paliers “abonnés → cashback” (voir §2.6)
- `MAX_CASHBACK_EUR` : plafond global (ex. 50)
- `SUBMISSION_WINDOW_DAYS` : 14 (à partir de “installation validée”)
- `CONTENT_VISIBILITY_DAYS` : 7 (posts/reels : contenu visible au moins 7 jours)
- `STORY_MIN_LIFETIME_HOURS` : 24 (stories : rester en ligne jusqu’à expiration)
- `MAX_CASHBACK_PER_ORDER` : 1
- `MAX_CASHBACK_PER_SOCIAL_ACCOUNT` : 1 (recommandé) ou cooldown (voir §2.7)

### 2.2 Éligibilité
Le Client est éligible si :
- commande **capturée** + “installation validée” (signature fin de chantier),
- compte social **public**,
- le compte est éligible à un palier `CASHBACK_TIERS` (preuve requise),
- le contenu respecte les exigences ci‑dessous,
- le Client soumet la demande dans la fenêtre `SUBMISSION_WINDOW_DAYS`.

### 2.3 Exigences de contenu (minimum)
Le contenu doit :
- mentionner clairement **Oasis Shattaf** (tag/mention/texte) et idéalement `@handle` + `#OasisShattaf`,
- contenir une mention de transparence type **“Publicité” / “Partenariat rémunéré” / “Collaboration commerciale”** (selon plateforme et règles applicables),
- être **public** et accessible pour vérification.

> Note : “20 € remboursés” = avantage/contrepartie. C’est donc une communication commerciale : la mention pub est indispensable.

### 2.4 Formats acceptés (MVP)
- **X (Twitter)** : post public (lien permanent).
- **Instagram** : post / reel public (lien permanent).  
  Stories : acceptées uniquement avec le **process Stories 24h** (preuves + éventuellement contrôle) — voir §3.4.
- **Facebook** : post public (et/ou reel).  
  Stories : idem Instagram — voir §3.4.

### 2.5 Anti‑abus (MVP)
- 1 cashback max par commande.
- Pas de comptes privés.
- Rejet si le contenu est supprimé trop tôt :
  - posts/reels : avant `CONTENT_VISIBILITY_DAYS` (si détecté),
  - stories : avant expiration (`STORY_MIN_LIFETIME_HOURS`) (si détecté).
  → pas de “clawback” via Stripe (une fois remboursé), mais blocage des futures demandes.
- Journal d’audit : tout est tracé (qui a approuvé, quand, preuve).

### 2.6 Paliers de cashback (followers)
Le cashback peut augmenter en fonction du nombre d’abonnés du compte qui publie.

**Exemple de paliers (à configurer)** :
| Abonnés (min) | Cashback (€) | Notes |
|---:|---:|---|
| 2 000 | 20 | MVP (par défaut) |
| 10 000 | 30 |  |
| 50 000 | 50 | peut nécessiter validation manuelle renforcée |

Règles :
- on applique le **plus haut palier atteint** au moment de la soumission (preuves datées),
- plafonner (`MAX_CASHBACK_EUR`) si besoin,
- si la preuve est ambiguë → appliquer le **palier inférieur** ou rejeter.

### 2.7 Anti‑fraude : “compte social déjà utilisé”
Objectif : empêcher qu’un même compte social encaisse plusieurs fois (ou soit “revendu”).

**Règle recommandée (simple)** :
- un compte social (`platform + platform_account_id`) ne peut obtenir qu’un cashback **qu’une seule fois** (`MAX_CASHBACK_PER_SOCIAL_ACCOUNT=1`).

**Si tu veux autoriser la récurrence** :
- remplacer par un cooldown : “1 cashback / compte / 180 jours” (paramètre), avec historisation des usages.

**Comment identifier un compte (ordre de préférence)** :
1) **ID stable via OAuth/API** (`platform_account_id`) : le plus fiable (évite les changements de pseudo).
2) À défaut : `handle` + URL de profil + preuves (moins fiable).

**Mesure anti‑vol de preuve (recommandée)** :
- générer un `CLAIM_CODE` unique par commande (ex. `SHATTAF-8X3K2P`) et exiger qu’il apparaisse dans le contenu (texte du post/story) pour lier la publication à la commande.

### 2.8 Exigences par plateforme (précis)
> Les @handles exacts “Oasis Shattaf” sont à figer (placeholders ci‑dessous).

**Placeholders**
- `OASIS_HANDLE_X` : ex. `@OasisShattaf`
- `OASIS_HANDLE_IG` : ex. `@oasis_shattaf`
- `OASIS_HANDLE_FB` : page Facebook Oasis Shattaf

**X (Twitter) — post**
- Contenu : texte + (optionnel) photo/vidéo.
- Doit inclure : `OASIS_HANDLE_X` + `CLAIM_CODE` + mention pub/partenariat.
- Preuve : URL du post (obligatoire) + capture du nombre d’abonnés.
- Contrôle : ouverture du lien (post public) + vérification mentions.

**Instagram — post/reel**
- Doit inclure : tag `OASIS_HANDLE_IG` + mention pub/partenariat + `CLAIM_CODE` (dans caption idéalement).
- Preuve : URL (si accessible) + capture abonnés + capture contenu si besoin.

**Instagram — story**
- Doit inclure : mention/tag `OASIS_HANDLE_IG` + mention pub/partenariat + `CLAIM_CODE`.
- Preuve : process Stories 24h (§3.4).

**Facebook — post/reel**
- Doit inclure : mention/tag de la page `OASIS_HANDLE_FB` + mention pub/partenariat + `CLAIM_CODE`.
- Preuve : URL du post (si public) + capture abonnés/likes (selon profil/page).

**Facebook — story**
- Doit inclure : mention/tag `OASIS_HANDLE_FB` + mention pub/partenariat + `CLAIM_CODE`.
- Preuve : process Stories 24h (§3.4).

---

## 3) Workflow utilisateur (Client)
### 3.1 Déclencheur (dans l’app Client)
Après “installation validée”, afficher un écran :
- “**Gagne jusqu’à X €** : poste une story / un post et on te rembourse” (selon paliers)
- Règles (followers minimum, mention pub obligatoire, formats acceptés)
- Boutons :
  - **Générer un contenu (IA)** (optionnel)
  - **Je publie mon propre contenu**
  - **Soumettre ma preuve**

### 3.2 Soumission (preuve)
Champs requis (MVP) :
- plateforme : `x | instagram | facebook`
- @handle / nom du compte
- `platform_account_id` (si OAuth/API ; sinon vide)
- URL de profil (si disponible)
- type de contenu : `post | reel | story`
- URL du contenu (si dispo)
- upload preuve (screenshot/vidéo) si story
- screenshot du nombre d’abonnés (ou autre preuve)
- `CLAIM_CODE` (si exigé) : code affiché dans le contenu pour lier la publication à la commande
- checkbox : “j’ai ajouté la mention Publicité/Partenariat”

### 3.3 Statuts visibles client
- `pending_review`
- `pending_story_24h_proof` (uniquement si story)
- `approved`
- `rejected` (+ motif)
- `refunded` (+ date, montant)

### 3.4 Process Stories 24h (Instagram/Facebook)
Objectif : réduire la fraude et vérifier que la story est restée en ligne **jusqu’à expiration** (`STORY_MIN_LIFETIME_HOURS=24`).

⚠️ Limite importante : sans accès API au compte (OAuth) il est **difficile** d’automatiser une vérification “100% certaine”. En MVP, on combine **preuves** + **spot‑checks** admin.

#### A) MVP (manuel, recommandé au démarrage)
1) **Avant de publier** : le client voit un `CLAIM_CODE` dans l’app.
2) **Publication** : le client poste une story **publique** contenant :
   - la mention Oasis Shattaf (tag/mention/texte),
   - la mention pub/partenariat,
   - le `CLAIM_CODE` (anti‑vol de preuve).
3) **Preuve immédiate (T0)** : le client soumet dans l’app :
   - une **capture vidéo (screen recording)** montrant la story en lecture + le `CLAIM_CODE`,
   - une capture du profil (handle + abonnés),
   - (optionnel) le lien de partage si la plateforme le fournit.
   → statut : `pending_story_24h_proof` (pas encore reviewable/refundable)
4) **Preuve après expiration (T0 + 24h)** : le client doit fournir l’un des éléments suivants (au choix, selon ce qui est possible sur son compte) :
   - capture de la story dans **Archive** (ou équivalent) avec date/heure,
   - OU ajout en **Highlight** + lien public (si possible),
   - ET/OU capture “Insights” de la story (vues/portée) avec date.
   → statut : repasse à `pending_review`
5) **Contrôle admin** :
   - vérifie mentions + `CLAIM_CODE`,
   - vérifie que la preuve “post‑expiration” existe (sinon rejet),
   - peut faire 0..N **spot‑checks** pendant la fenêtre 24h (si la story est consultable).
6) **Refund** : uniquement après validation complète (preuves T0 + T+24h).

#### B) V2 (semi‑automatisé via OAuth/API — à cadrer)
Principe : demander au client de **connecter** son compte social (OAuth) pour :
- récupérer un `platform_account_id` stable (anti‑changement de pseudo),
- récupérer le nombre d’abonnés de façon plus fiable,
- pouvoir **constater** qu’une story existe encore à `T+23h` (polling) et qu’elle a expiré normalement.

⚠️ Faisabilité dépendante :
- du **type de compte** (souvent Business/Creator requis côté Meta),
- des **permissions** et limites API,
- des coûts/accès API (notamment X).

Recommandation produit :
- MVP : privilégier **posts/reels** (vérification simple via lien permanent) ; stories acceptées mais **plus contraignantes**.

---

## 4) Workflow admin (Back‑office)
### 4.1 Queue de validation
Liste des demandes triées par :
- date de soumission
- montant
- plateforme
- statut
- risque (ex : nouveaux comptes / preuves faibles)

### 4.2 Écran de review
Admin voit :
- commande liée (order_id, client, date installation)
- preuves (followers screenshot + contenu)
- lien vers le post (si permanent)
- checkboxes : “mention Oasis Shattaf”, “mention pub”, “compte public”, “followers OK”
- palier calculé (followers → cashback) + historique du compte (déjà utilisé ?)

Actions :
- **Approve**
- **Reject** (motif obligatoire)
- **Request info** (optionnel, si tu veux un ping client)

### 4.3 Paiement (refund)
Si “Approve” :
- déclencher un **refund partiel** Stripe du montant validé (selon `CASHBACK_TIERS`) sur le PaymentIntent de la commande.
- si la commande est un **destination charge** (`transfer_data[destination]`) : ne pas activer `reverse_transfer=true` (le cashback est un coût plateforme ; ne pas récupérer sur le plombier).
- écrire `refund_id`, `refunded_at`, `amount_refunded`.

> Important : le cashback doit être supporté par la **plateforme** (coût marketing). Le reversement au plombier ne doit pas être affecté par ce cashback (à vérifier dans l’implémentation Stripe Connect).

---

## 5) Stripe — flux technique (résumé)
### 5.1 Où se situe le cashback
1) Client paye (PaymentIntent créé, `capture_method=manual`)  
2) Installation terminée + signée  
3) Capture PaymentIntent  
4) (Optionnel) transfert/payout plombier (selon règles plateforme)  
5) UGC validé → **refund partiel** (montant selon palier)

### 5.2 Contraintes
- Un refund peut prendre du temps à apparaître sur le relevé client (dépend banque/réseau).
- Les frais PSP ne sont pas forcément remboursés intégralement → considérer le cashback comme un coût “tout compris”.

### 5.3 Idempotence
Pour éviter double refund :
- clé idempotence par `order_id` + `ugc_submission_id`
- en DB : `refund_id` unique

---

## 6) IA — génération de contenu (option)
### 6.1 Modes
- Mode A : “Templates” (sans image)
  - 10 captions prêtes à poster (X/IG/FB) + CTA + hashtags
- Mode B : “Pack story” (3 slides)
  - 3 visuels typographiques + textes courts

### 6.2 Mentions obligatoires si image IA (France)
Si tu fournis une image/vidéo générée qui représente une personne de manière réaliste (“images virtuelles”), prévoir la mention légale appropriée et la mention pub/partenariat. (Voir `11_SOURCES.md`.)

### 6.3 Exemples de hooks (FR)
- “J’ai franchi le cap : plus de papier, plus propre.”
- “Après ça… difficile de revenir en arrière.”
- “Petit upgrade, énorme confort.”
- “Je consomme moins de papier, et ça change tout.”
- “La sensation ‘sortie de douche’… en 10 secondes.”

---

## 7) Spécification produit (écrans + API) — MVP
### 7.1 Écrans client
- `UGCOffer` (éligibilité, règles, CTA)
- `UGCComposer` (templates IA + copy)
- `UGCSubmit` (form + upload preuves)
- `UGCStatus` (suivi)

### 7.2 Écrans admin
- `UGCQueue` (liste + filtres)
- `UGCReview` (preuves + approve/reject + déclenche refund)

### 7.3 API (proposition)
- `POST /ugc/submissions`
- `POST /ugc/submissions/:id/story-24h-proof` (upload preuve post‑expiration, si story)
- `GET /ugc/submissions/me`
- `GET /admin/ugc/submissions`
- `POST /admin/ugc/submissions/:id/approve`
- `POST /admin/ugc/submissions/:id/reject`
- `POST /admin/ugc/submissions/:id/refund`

### 7.4 Modèle de données (proposition)
Table `ugc_submissions` :
- `id`
- `order_id`
- `customer_id`
- `platform` (`x|instagram|facebook`)
- `handle`
- `platform_account_id` (nullable)
- `profile_url` (nullable)
- `content_type` (`post|reel|story`)
- `content_url` (nullable)
- `proof_media_url` (nullable)
- `story_24h_proof_url` (nullable)  # requis si `content_type=story`
- `followers_proof_url`
- `followers_count` (nullable)
- `claim_code` (nullable)
- `cashback_tier_min_followers` (nullable)
- `cashback_amount_requested` (nullable)
- `status` (`pending_review|pending_story_24h_proof|approved|rejected|refunded`)
- `reviewed_by` (nullable)
- `review_notes` (nullable)
- `stripe_refund_id` (nullable)
- `refund_amount` (nullable)  # montant effectivement remboursé
- timestamps

Table `ugc_social_accounts` (pour anti‑fraude) :
- `id`
- `platform` (`x|instagram|facebook`)
- `platform_account_id` (nullable)
- `handle`
- `profile_url` (nullable)
- `first_seen_at`
- `last_seen_at`
- `times_used`
- `last_submission_id` (nullable)
- `blocked_reason` (nullable)

Contraintes :
- unicité “compte” : (`platform`, `platform_account_id`) si présent, sinon fallback (`platform`, `handle`)
- si `MAX_CASHBACK_PER_SOCIAL_ACCOUNT=1` : refuser toute nouvelle demande si `times_used >= 1`
