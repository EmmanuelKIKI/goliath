# GOLIATH — Backend

J'ai créé ce backend pour gérer mon élevage de poulets Goliath au quotidien. C'est le cœur de ma plateforme GOLIATH : toute la logique métier et toutes mes données passent par cette API. Le frontend (une PWA) viendra se connecter dessus.

Je gère mon élevage seul pour l'instant, donc cette version est pensée pour un seul utilisateur — mais je l'ai construite de façon assez propre pour pouvoir la faire évoluer plus tard si j'embauche.

## Ce que fait cette API

- **Bandes** : je crée et je suis chacune de mes bandes de poulets
- **Santé** : je note mes événements sanitaires, je planifie mes vaccinations, je suis ma mortalité
- **Stocks** : je gère mes articles (aliment, médicament, litière) et tous mes mouvements d'entrée/sortie
- **Finances** : je note mes dépenses et mes revenus, je calcule ma rentabilité par bande, j'exporte mes rapports
- **Clients & Ventes** : je garde une fiche de mes clients et j'enregistre mes ventes
- **Tâches** : je gère ma liste de tâches quotidiennes, avec ou sans lien vers une bande

## Stack technique

- **Node.js** + **Express** pour l'API REST
- **PostgreSQL** comme base de données
- **Prisma** comme ORM, pour définir mon schéma et interroger ma base facilement
- **JWT** (jsonwebtoken) + **bcryptjs** pour mon authentification
- **Helmet**, **CORS**, **Morgan** pour la sécurité et les logs

## Installation

Ce que je dois faire pour lancer ce backend chez moi :

### 1. Installer PostgreSQL

Si je ne l'ai pas déjà, j'installe PostgreSQL sur ma machine, ou j'utilise un service PostgreSQL hébergé (Railway, Render, Supabase...). Je crée une base de données vide, par exemple `goliath_db`.

### 2. Installer les dépendances

```bash
cd backend
npm install
```

### 3. Configurer mes variables d'environnement

```bash
cp .env.example .env
```

Puis j'ouvre `.env` et je remplis mes vraies valeurs, en particulier :
- `DATABASE_URL` avec mes identifiants PostgreSQL
- `JWT_SECRET` avec une longue chaîne aléatoire (je peux en générer une avec `openssl rand -hex 32`)

### 4. Créer les tables dans ma base de données

```bash
npm run prisma:migrate
```

Cette commande lit mon fichier `prisma/schema.prisma` et crée toutes mes tables dans PostgreSQL.

### 5. Créer mon compte utilisateur initial

J'ai deux façons de faire, au choix :

**Option A — avec le script de seed :**
```bash
npm run prisma:seed
```
Ça crée un compte avec l'email `dotomikiki@gmail.com et le mot de passe temporaire `ChangeMoiRapidement123`. Je pense à le changer rapidement.

**Option B — avec la route d'inscription**, une fois mon serveur lancé :
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nom":"Jean Kiki","email":"dotomikiki@gmail.com","motDePasse":"MonMotDePasseSecurise123"}'
```

Je ne peux créer qu'un seul compte : la route bloque volontairement toute inscription supplémentaire, puisque je suis seul à utiliser la plateforme pour l'instant.

### 6. Lancer mon serveur

En développement (avec redémarrage automatique) :
```bash
npm run dev
```

En production :
```bash
npm start
```

Mon API tourne alors sur `http://localhost:4000` (ou le port que j'ai défini dans `.env`).

## Structure de mes dossiers

```
backend/
├── src/
│   ├── controllers/     # Toute ma logique métier, module par module
│   ├── routes/          # La définition de mes routes HTTP
│   ├── middlewares/      # Authentification et gestion des erreurs
│   ├── utils/            # Petits outils réutilisés partout (validation, erreurs...)
│   ├── prismaClient.js   # Ma connexion unique à la base de données
│   └── index.js          # Le point de démarrage de mon serveur
├── prisma/
│   ├── schema.prisma      # Le schéma complet de ma base de données
│   └── seed.js             # Script pour créer mon compte initial
├── .env.example
└── package.json
```

## Authentification

Toutes mes routes, sauf `/auth/login` et `/auth/register`, exigent un token JWT. Je récupère ce token en me connectant via `/auth/login`, puis je l'envoie dans chaque requête suivante :

```
Authorization: Bearer <mon_token>
```

Mon token est valable 7 jours par défaut (je peux changer ça avec `JWT_EXPIRES_IN` dans mon `.env`).

## Aperçu des routes principales

| Méthode | Route | Ce que ça fait |
|---|---|---|
| POST | `/auth/login` | Je me connecte |
| GET | `/dashboard` | Mon tableau de bord global |
| GET/POST | `/bandes` | Je liste / crée une bande |
| GET/POST | `/bandes/:bandeId/journal-sanitaire` | Mon journal sanitaire par bande |
| GET | `/bandes/:bandeId/mortalite` | Mes statistiques de mortalité |
| GET/POST | `/vaccinations` | Mon calendrier de vaccination |
| GET/POST | `/stocks/articles` | Mes articles de stock |
| POST | `/stocks/mouvements` | Mes entrées/sorties de stock |
| GET/POST | `/finances/transactions` | Mes dépenses et revenus |
| GET | `/finances/rentabilite/:bandeId` | La rentabilité d'une bande |
| GET | `/finances/rapport/export` | Export CSV de mon rapport financier |
| GET/POST | `/clients` | Mes fiches clients |
| GET/POST | `/ventes` | Mes ventes |
| GET/POST | `/taches` | Mes tâches personnelles |

Toutes les routes acceptent aussi PUT et DELETE là où ça a du sens (je modifie ou je supprime un enregistrement).

## Ce que je prévois pour la suite

- Un frontend en PWA (React + Vite) qui vient consommer cette API
- Peut-être, plus tard, une vraie gestion multi-utilisateurs si j'embauche
- Des notifications automatiques (email ou SMS) pour mes alertes de stock et de vaccination
