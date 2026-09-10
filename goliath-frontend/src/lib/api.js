// Je centralise ici tous mes appels à mon backend. Je configure une
// seule instance axios avec mon URL de base, et deux intercepteurs :
// un qui attache mon token JWT à chaque requête, et un qui me
// déconnecte automatiquement si mon token a expiré.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

// Avant chaque requête, j'attache mon token si je suis connecté.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("goliath_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si mon backend me répond 401 (token invalide ou expiré), je nettoie
// ma session et je renvoie vers la page de connexion. Je le fais ici
// plutôt que dans chaque page pour ne jamais oublier ce cas.
api.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    if (erreur.response?.status === 401) {
      localStorage.removeItem("goliath_token");
      localStorage.removeItem("goliath_nom");
      if (window.location.pathname !== "/connexion") {
        window.location.href = "/connexion";
      }
    }
    return Promise.reject(erreur);
  }
);

// Petit utilitaire que je réutilise partout pour sortir un message
// d'erreur lisible de la réponse de mon backend, avec un message de
// secours si jamais le réseau est simplement coupé.
export function extraireMessageErreur(erreur) {
  if (!erreur.response) {
    return "Je n'arrive pas à joindre le serveur. Je vérifie ma connexion internet.";
  }
  return erreur.response.data?.message || "Une erreur inattendue est survenue.";
}

export default api;
