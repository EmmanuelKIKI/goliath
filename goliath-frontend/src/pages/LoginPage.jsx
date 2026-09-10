// Ma page de connexion, réduite à l'essentiel : je suis seul à avoir
// le lien de cette application, donc je n'ai besoin ni d'un email ni
// d'un mot de passe. Je tape juste mon nom, et si ça correspond à ce
// que j'ai configuré côté serveur (ACCES_NOM), je suis connecté.

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extraireMessageErreur } from "../lib/api";
import Button from "../components/Button";
import { Champ, ChampTexte } from "../components/Champs";

export default function LoginPage() {
  const { connexion, nom: nomConnecte, chargementInitial } = useAuth();
  const [nom, setNom] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  if (!chargementInitial && nomConnecte) {
    return <Navigate to="/" replace />;
  }

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await connexion(nom);
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
        <h1 className="font-display text-3xl font-semibold text-pintade mb-1">C'est moi</h1>
        <p className="text-sm text-pintade-light mb-8">
          Je tape mon nom pour retrouver mon élevage.
        </p>

        <form onSubmit={gererEnvoi}>
          <Champ label="Mon nom" obligatoire>
            <ChampTexte
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Mon prénom ou mon nom"
              required
              autoFocus
              autoComplete="off"
            />
          </Champ>

          {erreur && (
            <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>
          )}

          <Button type="submit" className="w-full" disabled={envoiEnCours}>
            {envoiEnCours ? "Connexion..." : "Entrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
