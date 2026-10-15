# Plan d'Internationalisation Complète OMNI (Global Mobile Standard)

## 1. Sélecteur d'Indicatif Téléphonique Mondial lors du Sign-Up
- **Problème actuel** : Le champ téléphone affiche par défaut un exemple statique avec le préfixe français `+33`.
- **Solution** :
  - Ajouter un **sélecteur déroulant d'indicatif international** à côté du champ numéro de téléphone (`+1` USA/Canada, `+44` UK, `+33` France, `+212` Maroc, `+213` Algérie, `+216` Tunisie, `+225` Côte d'Ivoire, `+971` EAU, `+49` Allemagne, `+34` Espagne, `+81` Japon, `+91` Inde, etc.).
  - Pré-remplir automatiquement l'indicatif en fonction du fuseau ou de la langue détectée du système, tout en permettant à l'utilisateur de choisir n'importe quel pays de la liste mondiale (195+ pays).
  - Placeholder neutre international `612345678` avec affichage du drapeau du pays sélectionné.

## 2. Dé-francisation & Dé-parisisation de Google Maps
- **Problème actuel** : La carte démarre sur des coordonnées statiques centrées sur Paris (`{ lat: 48.8566, lng: 2.3522 }`) et des lieux fictifs parisiens ("Coworking Tech Hub", "Café Deep Focus").
- **Solution** :
  - **Centrage prioritaire immédiat sur le GPS réel de l'utilisateur** : dès l'ouverture, la carte utilise `navigator.geolocation` pour zoomer directement sur la ville ou le pays réel où se trouve l'utilisateur partout dans le monde.
  - **Repli international mondial** : Si la permission GPS est en attente ou refusée, la carte s'ouvre sur une vue globale internationale (World Overview, zoom 2-3 sans focus sur la France) ou sur les coordonnées de la nationalité choisie dans les préférences.
  - **Points d'intérêts dynamiques & internationaux** : Les suggestions de cafés, coworking et hubs sont recherchées en temps réel autour de la position GPS réelle de l'utilisateur au lieu de points parisiens codés en dur.

## 3. Détection Globale de la Langue & Fuseau dans PreferencesContext
- Initialiser la langue par défaut en vérifiant la langue réelle du navigateur/smartphone (`navigator.language`, ex: `en`, `es`, `fr`, `ar`, etc.) au lieu d'imposer le français par défaut.
- Détecter automatiquement le fuseau horaire mondial réel (`Intl.DateTimeFormat().resolvedOptions().timeZone`).

---

Validation via `lint_applet` et `compile_applet`.
