// src/services/supabaseClient.js
// Un seul client supabase-js pour toute l'application. Je n'utilise jamais
// de clé de service ici — uniquement l'URL et la clé anonyme publiques,
// protégées par les policies RLS côté serveur.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Je préfère un échec explicite au démarrage plutôt qu'un comportement
  // silencieux et confus plus tard.
  console.error(
    "VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant. Vérifie ton fichier .env.local.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "goliath-auth",
  },
});

// URL de base pour appeler mes Edge Functions directement en fetch quand je
// n'ai pas encore de session (auth-login), ou via supabase.functions.invoke
// une fois connecté.
export const edgeFunctionUrl = (name) => `${supabaseUrl}/functions/v1/${name}`;
