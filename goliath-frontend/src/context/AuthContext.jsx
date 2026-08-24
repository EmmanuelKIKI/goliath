// Je gère ici mon état de connexion, accessible depuis n'importe quel
// composant de mon app grâce au Context de React. Je stocke mon token
// et mes infos de profil dans localStorage pour rester connecté même
// si je ferme et rouvre l'app.

import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargementInitial, setChargementInitial] = useState(true);

  // Au premier chargement de mon app, je vérifie si j'ai déjà un
  // token stocké et, si oui, je récupère mon profil pour confirmer
  // qu'il est toujours valide.
  useEffect(() => {
    const token = localStorage.getItem("goliath_token");
    if (!token) {
      setChargementInitial(false);
      return;
    }

    api
      .get("/auth/moi")
      .then((reponse) => setUtilisateur(reponse.data.utilisateur))
      .catch(() => {
        localStorage.removeItem("goliath_token");
      })
      .finally(() => setChargementInitial(false));
  }, []);

  async function connexion(email, motDePasse) {
    const reponse = await api.post("/auth/login", { email, motDePasse });
    localStorage.setItem("goliath_token", reponse.data.token);
    setUtilisateur(reponse.data.utilisateur);
  }

  function deconnexion() {
    localStorage.removeItem("goliath_token");
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, connexion, deconnexion, chargementInitial }}>
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
