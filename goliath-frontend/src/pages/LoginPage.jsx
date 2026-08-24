// Ma page de connexion. Comme je suis seul utilisateur de la
// plateforme, je n'ai pas de lien "créer un compte" ici : mon compte
// initial se crée via le script de seed ou la route /auth/register,
// une seule fois, côté backend.

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extraireMessageErreur } from "../lib/api";
import Button from "../components/Button";
import { Champ, ChampTexte } from "../components/Champs";

export default function LoginPage() {
  const { connexion, utilisateur, chargementInitial } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  if (!chargementInitial && utilisateur) {
    return <Navigate to="/" replace />;
  }

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await connexion(email, motDePasse);
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bande-plumage" aria-hidden="true" />
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-sm mx-auto w-full">
        <p className="text-xs uppercase tracking-widest text-mais-dark font-semibold mb-1">GOLIATH</p>
        <h1 className="font-display text-3xl font-semibold text-pintade mb-1">Je me connecte</h1>
        <p className="text-sm text-pintade-light mb-8">
          Ma plateforme de gestion d'élevage, tout en un.
        </p>

        <form onSubmit={gererEnvoi}>
          <Champ label="Email" obligatoire>
            <ChampTexte
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean@goliath.local"
              required
              autoFocus
            />
          </Champ>

          <Champ label="Mot de passe" obligatoire>
            <ChampTexte
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Champ>

          {erreur && (
            <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>
          )}

          <Button type="submit" className="w-full" disabled={envoiEnCours}>
            {envoiEnCours ? "Connexion..." : "Me connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
