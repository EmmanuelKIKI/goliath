// Je liste ici toutes mes bandes de poulets, avec la possibilité d'en
// créer une nouvelle. Je filtre par statut pour ne pas être noyé par
// mes bandes déjà archivées.

import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { Champ, ChampTexte, ChampNombre, ChampDate } from "../components/Champs";
import { useApi } from "../hooks/useApi";
import api, { extraireMessageErreur } from "../lib/api";
import { formaterDate } from "../lib/format";

export default function BandesListPage() {
  const [filtreStatut, setFiltreStatut] = useState("actif");
  const [modalOuvert, setModalOuvert] = useState(false);

  const { donnees: bandes, chargement, erreur, recharger } = useApi(
    () => api.get("/bandes", { params: { statut: filtreStatut } }).then((r) => r.data.bandes),
    [filtreStatut]
  );

  return (
    <AppShell titre="Mes bandes">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {["actif", "archive"].map((statut) => (
            <button
              key={statut}
              onClick={() => setFiltreStatut(statut)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                filtreStatut === statut ? "bg-indigo text-sable" : "bg-sable-deep text-pintade-light"
              }`}
            >
              {statut === "actif" ? "Actives" : "Archivées"}
            </button>
          ))}
        </div>
        <Button onClick={() => setModalOuvert(true)}>+ Nouvelle bande</Button>
      </div>

      {chargement && <Spinner />}
      {erreur && <p className="text-sm text-rouille">{erreur}</p>}

      {bandes && bandes.length === 0 && (
        <EmptyState
          titre="Je n'ai aucune bande ici"
          description="J'ajoute ma première bande pour commencer mon suivi."
          action={<Button onClick={() => setModalOuvert(true)}>+ Nouvelle bande</Button>}
        />
      )}

      <div className="flex flex-col gap-3">
        {bandes?.map((bande) => (
          <Link key={bande.id} to={`/bandes/${bande.id}`}>
            <Card accent="indigo">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold">{bande.code}</p>
                  <p className="text-sm text-pintade-light">
                    Arrivée le {formaterDate(bande.dateArrivee)} · {bande.origine}
                  </p>
                </div>
                <div className="text-right">
                  <p className="chiffre font-semibold">{bande.effectifActuel}</p>
                  <p className="text-xs text-pintade-light">sur {bande.effectifInitial}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <ModalNouvelleBande
        ouvert={modalOuvert}
        onFermer={() => setModalOuvert(false)}
        onCree={() => {
          setModalOuvert(false);
          recharger();
        }}
      />
    </AppShell>
  );
}

function ModalNouvelleBande({ ouvert, onFermer, onCree }) {
  const [code, setCode] = useState("");
  const [dateArrivee, setDateArrivee] = useState("");
  const [effectifInitial, setEffectifInitial] = useState("");
  const [origine, setOrigine] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post("/bandes", { code, dateArrivee, effectifInitial, origine });
      setCode("");
      setDateArrivee("");
      setEffectifInitial("");
      setOrigine("");
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="J'ajoute une nouvelle bande" ouvert={ouvert} onFermer={onFermer}>
      <form onSubmit={gererEnvoi}>
        <Champ label="Code de ma bande" obligatoire>
          <ChampTexte value={code} onChange={(e) => setCode(e.target.value)} placeholder="BND-2026-01" required />
        </Champ>
        <Champ label="Date d'arrivée" obligatoire>
          <ChampDate value={dateArrivee} onChange={(e) => setDateArrivee(e.target.value)} required />
        </Champ>
        <Champ label="Effectif initial" obligatoire>
          <ChampNombre value={effectifInitial} onChange={(e) => setEffectifInitial(e.target.value)} min="1" required />
        </Champ>
        <Champ label="Origine" obligatoire>
          <ChampTexte value={origine} onChange={(e) => setOrigine(e.target.value)} placeholder="Achat poussins, couvoir X..." required />
        </Champ>

        {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

        <Button type="submit" className="w-full" disabled={envoiEnCours}>
          {envoiEnCours ? "Création..." : "Créer ma bande"}
        </Button>
      </form>
    </Modal>
  );
}
