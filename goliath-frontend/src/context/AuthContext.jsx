// Je gère ici mon état de connexion. Comme je suis seul à avoir le
// lien de mon application, mon "compte" n'a ni email ni mot de passe :
// juste mon nom, comparé côté serveur à une valeur secrète (ACCES_NOM).
// Je garde mon token et mon nom dans localStorage pour rester
// connecté même si je ferme et rouvre l'app.

import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [nom, setNom] = useState(null);
  const [chargementInitial, setChargementInitial] = useState(true);

  // Au premier chargement de mon app, je vérifie si j'ai déjà un
  // token stocké et, si oui, je confirme qu'il est toujours valide
  // auprès de mon serveur (sans avoir besoin d'aller chercher quoi
  // que ce soit en base de données côté backend).
  useEffect(() => {
    const token = localStorage.getItem("goliath_token");
    const nomStocke = localStorage.getItem("goliath_nom");

    if (!token) {
      setChargementInitial(false);
      return;
    }

    api
      .get("/auth/verifier")
      .then(() => setNom(nomStocke))
      .catch(() => {
        localStorage.removeItem("goliath_token");
        localStorage.removeItem("goliath_nom");
      })
      .finally(() => setChargementInitial(false));
  }, []);

  // Je n'envoie que mon nom. Mon serveur le compare à ACCES_NOM et
  // me renvoie un token si ça correspond.
  async function connexion(nomSaisi) {
    const reponse = await api.post("/auth/connexion", { nom: nomSaisi });
    localStorage.setItem("goliath_token", reponse.data.token);
    localStorage.setItem("goliath_nom", reponse.data.nom);
    setNom(reponse.data.nom);
  }

  function deconnexion() {
    localStorage.removeItem("goliath_token");
    localStorage.removeItem("goliath_nom");
    setNom(null);
  }

  return (
    <AuthContext.Provider value={{ nom, connexion, deconnexion, chargementInitial }}>
      {children}
    </AuthContext.Provider>
  );
}

// Mon hook pratique pour accéder à l'auth depuis n'importe quel composant.
export function useAuth() {
  const contexte = useContext(AuthContext);
  if (!contexte) {
    throw new Error("useAuth doit être utilisé à l'intérieur de mon AuthProvider.");
  }
  return contexte;
}
