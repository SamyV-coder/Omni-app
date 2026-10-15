# Plan d'Implémentation - Refonte Mobile & Optimisation WebIntoApp (FixKon Style)

## 1. Fluidité & Optimisations WebView / WebIntoApp (Mobile-First)
- **Safe Area Insets** : Prise en charge de `env(safe-area-inset-top)` et `env(safe-area-inset-bottom)` pour les encoches et barres de geste.
- **Accélération matérielle** : Transitions CSS `transform` et `opacity`, suppression de la latence tactile (`touch-action: manipulation`).
- **Responsive adaptatif** : Barre de navigation mobile fluide et intuitive.

## 2. Écran d'Onboarding / Authentification Directe au 1er Lancement
- Formulaire d'inscription / connexion direct dès la première ouverture :
  - Champs obligatoires : **Email**, **Mot de passe** et **Numéro de téléphone**.
  - Validation et persistance locale (`omni_user_profile`, `omni_user_credentials`) avec redirection immédiate vers l'interface principale.
  - Option Google Sign-In également intégrée.

## 3. Refonte de la Navigation (Onglets Principaux & Déplacement dans Settings)
- Barre principale épurée : **HUB**, **FOCUS**, **ACADEMY**, **COMMUNITY**, **SERVICE**, **LIFE OS**, **UPGRADE**, **SETTINGS**.
- Déplacement des accès directs **Google Maps**, **Gmail** et **Google Drive** à l'intérieur des **Paramètres / Settings**.

## 4. Nouvel Onglet Dédié "Upgrade"
- Centralisation de toutes les offres :
  - Boost d'annonces Marketplace.
  - Coach IA VIP Academy.
  - Pass OMNI Tout-en-Un (All-Access).
  - Système de don participatif "Offre-moi un café".

## 5. Module Focus & Life OS : Générateur de Routine Intelligent & Alarmes
- Création manuelle intuitive d'alarmes et routines dans `Focus.tsx`.
- Générateur automatique en langage naturel dans `Life OS` (dictée vocale ou texte libre).
- Extraction automatique des heures et programmation directe des alarmes et rappels personnalisables.
