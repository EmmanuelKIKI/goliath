# GOLIATH — Frontend (PWA)

J'ai construit cette PWA pour piloter mon élevage de poulets Goliath depuis mon téléphone, directement sur le terrain. Elle se connecte à mon backend GOLIATH (API Node.js/Express) et couvre mes 4 modules : santé & mortalité, stocks, finances, et tâches — plus mes clients et mes ventes.

Je l'ai pensée mobile-first parce que je m'en sers avec mes doigts, dans mon poulailler, pas assis à un bureau. Elle est installable sur mon écran d'accueil comme une vraie application, et reste consultable même si ma connexion coupe.

## Identité visuelle

Je n'ai pas voulu d'un thème générique. J'ai construit ma propre palette "terre et plumage" :

- **Sable** — mon fond, un beige chaud et lisible en plein soleil
- **Nuit Pintade** — mon encre principale (texte, navigation)
- **Indigo Basse-cour** — ma couleur d'action (boutons, liens)
- **Maïs** — mes mises en avant et accents secondaires
- **Feuille** — réservée à ce qui va bien (marge positive, effectif stable)
- **Rouille** — réservée strictement à mes alertes critiques (mortalité, stock épuisé)

Ma typographie : **Space Grotesk** pour mes titres, **Inter** pour le texte courant, **IBM Plex Mono** pour tous mes chiffres (montants, quantités), pour que mes colonnes de données s'alignent bien.

Ma signature visuelle est la fine bande "plumage" en haut de l'app, inspirée des rayures du plumage du poulet Goliath et de la pintade.

## Stack technique

- **React 18** + **Vite** pour le build
- **React Router** pour la navigation
- **Tailwind CSS** pour le style, avec mes tokens de design personnalisés
- **Axios** pour parler à mon API
- **Recharts** pour ma courbe de mortalité
- **vite-plugin-pwa** pour rendre l'app installable et utilisable hors-ligne

## Installation

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

### 2. Configurer mes variables d'environnement

```bash
cp .env.example .env
```

Par défaut, `VITE_API_URL` pointe vers `http://localhost:4000`, l'adresse de mon backend en local. Je change cette valeur si mon API tourne ailleurs (par exemple une fois déployée).

### 3. Lancer le backend d'abord

Mon frontend a besoin de mon API GOLIATH pour fonctionner. Je m'assure que le backend tourne (voir son propre README) avant de lancer le frontend.

### 4. Lancer mon frontend en développement

```bash
npm run dev
```

Mon app est alors accessible sur `http://localhost:5173`.

### 5. Me connecter

Je me connecte avec le compte que j'ai créé côté backend (via le script de seed ou la route d'inscription). Cette version est prévue pour un seul utilisateur : moi.

## Build de production

```bash
npm run build
```

Ça génère un dossier `dist/` prêt à être déployé sur n'importe quel hébergeur de fichiers statiques (Netlify, Vercel, un simple serveur nginx...). Je pense à configurer `VITE_API_URL` avec l'adresse réelle de mon backend avant de builder.

Je peux prévisualiser ce build en local avec :
```bash
npm run preview
```

## Installer l'app comme une vraie application

Une fois mon frontend en ligne (ou même en local avec `npm run dev`), je peux l'ajouter à l'écran d'accueil de mon téléphone :
- **Android (Chrome)** : menu → "Ajouter à l'écran d'accueil"
- **iPhone (Safari)** : bouton de partage → "Sur l'écran d'accueil"

Elle s'ouvre alors comme une app native, sans barre d'adresse.

## Fonctionnement hors-ligne

J'ai activé un service worker qui met en cache l'interface de mon app et mes dernières données consultées (mes bandes, mes stocks, mes finances...). Si je perds ma connexion sur le terrain :
- Je vois un bandeau rouge en haut de l'écran m'indiquant que je suis hors-ligne
- Je peux toujours consulter les dernières données que j'ai chargées
- Je ne peux pas enregistrer de nouvelles données tant que ma connexion n'est pas revenue (pas de synchronisation différée dans cette version)

## Structure de mes dossiers

```
frontend/
├── public/
│   └── icons/              # Mes icônes PWA (192px et 512px)
├── src/
│   ├── components/         # Mes composants réutilisables (Card, Button, Modal...)
│   ├── context/             # Mon contexte d'authentification global
│   ├── hooks/                # useApi (appels API) et useOnlineStatus (réseau)
│   ├── lib/                   # Client API (axios) et fonctions de formatage
│   ├── pages/                  # Une page par écran de mon app
│   ├── App.jsx                  # Toutes mes routes
│   ├── main.jsx                  # Point d'entrée React
│   └── index.css                  # Mes styles globaux et ma bande "plumage"
├── index.html
├── vite.config.js            # Config Vite + PWA
├── tailwind.config.js        # Ma palette et ma typographie
└── package.json
```

## Aperçu de mes pages

| Page | Ce que j'y fais |
|---|---|
| `/connexion` | Je me connecte |
| `/` | Mon tableau de bord : alertes, marge du mois, tâches du jour |
| `/bandes` | Je liste et je crée mes bandes |
| `/bandes/:id` | Fiche complète d'une bande : santé, mortalité, stock lié, finances liées, tâches |
| `/stocks` | Mes articles de stock et mes mouvements |
| `/finances` | Mes transactions, ma marge, l'export CSV |
| `/clients-ventes` | Mes fiches clients et mes ventes |
| `/taches` | Ma liste de tâches quotidiennes |
| `/parametres` | Mon profil et les infos de l'app |

## Ce que je prévois pour la suite

- Une vraie synchronisation différée : pouvoir enregistrer une donnée hors-ligne et qu'elle s'envoie automatiquement au retour du réseau
- Des notifications push pour mes alertes de stock et de vaccination
- Une gestion multi-utilisateurs si j'embauche un jour
