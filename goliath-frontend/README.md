# GOLIATH — Frontend (React + Vite + Supabase)

C'est la PWA de ma ferme avicole GOLIATH : React, Vite, Tailwind, connectée
directement à Supabase. Elle dépend entièrement du backend (schéma, RLS,
vues KPI, Edge Functions) généré séparément.

Toute logique métier critique, tout calcul officiel, toute validation
importante reste côté serveur/SQL. Je ne considère jamais le frontend comme
une source de vérité : effectif théorique, écarts et KPI viennent toujours
de valeurs déjà calculées côté serveur.

## 1. Stack

- React 18 + Vite + JavaScript, React Router
- Tailwind CSS (palette imposée : voir `tailwind.config.js`)
- `@supabase/supabase-js` pour toutes les données et le stockage des photos
- PWA : `public/manifest.json` + `service-worker.js` gérés à la main
- IndexedDB (`idb`) pour le stockage local et le mode hors connexion
- Lucide React pour les icônes
- Recharts pour les graphiques des Statistiques

## 2. Arborescence

```
goliath-frontend/
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
├── src/
│   ├── components/       (Toast, ConfirmDialog, OfflineBanner, KpiCard, AlertBanner, EmptyState, LoadingState, FormField, DynamicList)
│   ├── pages/             (Login, Dashboard, DailyTracking, History, Statistics, HealthAssistant, Settings, Conflicts)
│   │   └── ferme/          (FarmLayout, Buildings, Lots, Weight, Purchases)
│   ├── layouts/           (AppLayout, Sidebar, BottomNav, navConfig)
│   ├── services/
│   │   ├── supabaseClient.js
│   │   ├── api.js
│   │   ├── storage.js
│   │   ├── imageCompression.js
│   │   ├── syncQueue.js
│   │   ├── backupExport.js
│   │   └── indexedDb.js
│   ├── hooks/              (useAuth, useToast, useOnlineStatus, useSyncStatus)
│   ├── utils/               (format.js)
│   ├── styles/index.css
│   ├── App.jsx
│   └── main.jsx
├── vercel.json
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example
└── README.md
```

**Écart assumé n°4** : le prompt plaçait `service-worker.js` à la racine du
projet. Vite ne copie dans `dist/` que ce qui se trouve dans `public/` — un
fichier à la racine du projet n'est jamais servi en production. Je l'ai
donc déplacé dans `public/service-worker.js` ; `main.jsx` continue de
l'enregistrer avec le chemin `/service-worker.js`, qui reste correct.

## 3. Règle d'architecture

- CRUD (lots, bâtiments, suivis, aliment, achats, eau, santé, traitements,
  vaccinations, hygiène, œufs, poids, incidents, paramètres, statistiques,
  historique IA) → direct via `supabase-js` (voir `src/services/api.js`),
  protégé par RLS. Jamais d'Edge Function pour ça.
- Gemini → Edge Functions `ai-veterinaire`, `ai-analyse-elevage`,
  `ai-analyse-image`, appelées via `supabase.functions.invoke`.
- Connexion → Edge Function `auth-login` uniquement.
- KPI → fonction SQL `get_lot_kpis` en RPC ; jamais recalculés ici.

## 4. Connexion

L'écran affiche "GOLIATH — Ma Ferme Avicole" puis un champ "Code d'accès".
Le code saisi est envoyé à `auth-login` ; si correct, les jetons reçus sont
injectés via `supabase.auth.setSession()`. Le frontend ne connaît jamais
`APP_USER_EMAIL` ni `APP_USER_PASSWORD`.

## 5. Mode hors connexion et synchronisation

- Chaque enregistrement reçoit son UUID définitif dès sa création
  (`crypto.randomUUID()`), même hors connexion.
- `src/services/indexedDb.js` tient le cache local (un store par table) et
  la `sync_queue` (file d'opérations en attente, FIFO).
- `src/services/syncQueue.js` rejoue la file au retour de connexion : une
  opération est envoyée une seule fois puis retirée avant la suivante.
- Un conflit (`base_updated_at` obsolète) ne s'écrase jamais silencieusement
  : l'élément passe dans `/parametres/conflits`, où je choisis manuellement
  quelle version garder.
- Une suppression rejouée sur une ligne déjà supprimée est un succès
  silencieux.
- Gemini nécessite Internet : hors connexion, l'Assistant santé affiche
  "L'assistant IA nécessite une connexion Internet." et bloque l'appel côté
  client avant même la tentative réseau.

## 6. Assistant santé

Zone de texte + bouton "Analyser" → `ai-veterinaire`. Photo : compression
client (1600px max, JPEG ~80 %) via `imageCompression.js`, upload direct
dans le bucket `ai-photos`, puis seul `image_path` est envoyé à
`ai-analyse-image`. Bouton "Analyser mon élevage" → `ai-analyse-elevage`.
Le bandeau "les analyses sont indicatives..." reste affiché en permanence.
L'historique IA lit directement `ai_analyses` (pas d'Edge Function).

## 7. Écarts assumés par rapport au prompt

- **Changement du code d'accès depuis l'application** : le prompt frontend
  demande cette fonctionnalité "via auth-login", mais le backend livré
  n'expose que 4 Edge Functions au total (`auth-login` +  3 fonctions
  Gemini), et `auth-login` ne fait que vérifier un code existant, jamais le
  modifier. Je n'ai donc pas implémenté ce changement dans l'application :
  l'écran Paramètres l'indique clairement, et le code se change pour
  l'instant via `supabase secrets set APP_ACCESS_CODE_HASH=...`.
- **Export PDF** : explicitement secondaire dans le prompt ("à implémenter
  si raisonnable, jamais prioritaire"). Je ne l'ai pas construit, au profit
  du CSV et du JSON complet (sauvegarde/restauration), qui couvrent déjà les
  usages de consultation et de restauration.
- **Alertes automatiques** : elles comparent des champs déjà calculés côté
  serveur (`count_difference`, `deaths`, `actual_stock`) aux seuils de
  `farm_settings`. Il n'existe pas de vue SQL dédiée "alertes" dans le
  backend livré ; la comparaison aux seuils a donc lieu dans
  `src/pages/Dashboard.jsx`, pas dans une fonction SQL.

## 8. Checklist de déploiement (Vercel + Supabase)

Le code n'a besoin d'aucune autre modification que celle listée au point 7
(déjà faite dans ce zip). Ce qui reste est de la configuration, pas du code :

**Côté Supabase (une fois)**
1. `supabase db push` — applique les 5 migrations du backend.
2. `supabase functions deploy` pour les 4 Edge Functions.
3. `supabase secrets set ...` — tous les secrets serveur (jamais dans le frontend).
4. Lancer `supabase/seed/create-app-user.ts` pour créer l'utilisateur unique.
5. Rien à changer dans `supabase/config.toml` (`site_url`) : je n'utilise ni
   lien magique ni redirection OAuth — `auth-login` renvoie les jetons
   directement, donc cette valeur ne sert pas en production ici.

**Côté Vercel (une fois)**
1. Importer le repo, framework détecté automatiquement : **Vite**.
2. Build command `npm run build`, output directory `dist` (valeurs par
   défaut du preset Vite — rien à changer).
3. Ajouter les variables d'environnement `VITE_SUPABASE_URL` et
   `VITE_SUPABASE_ANON_KEY` (Project Settings → Environment Variables),
   valables pour Production, Preview et Development.
4. `vercel.json` (ajouté dans ce zip) fait deux choses : il réécrit toutes
   les routes vers `index.html` pour que React Router fonctionne après un
   rafraîchissement de page (ex. `/statistiques`), et il empêche la mise en
   cache agressive de `service-worker.js` pour que mes mises à jour
   arrivent bien aux utilisateurs.
5. Rien à faire côté CORS : `_shared/cors.ts` autorise déjà `*` sur les
   Edge Functions, donc n'importe quel domaine Vercel (production ou
   preview) fonctionne sans configuration supplémentaire.

## 9. Installation et commandes (Windows / PowerShell)

```powershell
# Installer les dépendances
npm install

# Copier et remplir mes variables locales
Copy-Item .env.example .env.local
notepad .env.local

# Lancer en local
npm run dev

# Build de production
npm run build
npm run preview

# Déploiement Vercel
npm install -g vercel
vercel login
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

## 10. Ce que je n'ai pas construit (volontairement)

Marketplace, paiement, abonnement, publicité, réseau social, chat entre
utilisateurs, système d'employés ou rôles complexes, IA présentée comme un
médecin/vétérinaire, Edge Function pour du simple CRUD, parcours à dix
écrans pour enregistrer une simple mortalité.

## 11. Priorité si un choix s'impose

Données → fonctionnement offline → synchronisation → sécurité → IA →
statistiques → exports.
