// Ma liste de tâches personnelles. Je gère la ferme seul, donc pas
// d'assignation à un employé : je crée, je coche, c'est tout.

import { useState } from "react";
import AppShell from "../components/AppShell";
import Card from "../components/Card";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { Champ, ChampTexte, ChampDate, ChampSelect } from "../components/Champs";
import { useApi } from "../hooks/useApi";
import api, { extraireMessageErreur } from "../lib/api";
import { formaterDate } from "../lib/format";

export default function TachesPage() {
  const [filtre, setFiltre] = useState("today");
  const [modalOuvert, setModalOuvert] = useState(false);

  const { donnees: taches, chargement, erreur, recharger } = useApi(
    () => api.get("/taches", { params: filtre === "today" ? { date: "today" } : {} }).then((r) => r.data.taches),
    [filtre]
  );

  async function basculerStatut(tache) {
    // Je fais une mise à jour optimiste pour que ça réagisse
    // instantanément au clic, même si ma connexion est un peu lente.
    const nouveauStatut = tache.statut === "fait" ? "a_faire" : "fait";
    try {
      await api.put(`/taches/${tache.id}`, { statut: nouveauStatut });
      recharger();
    } catch (e) {
      // Si ça échoue, je laisse recharger() remettre l'état réel.
      recharger();
    }
  }

  return (
    <AppShell titre="Mes tâches" actions={<Button onClick={() => setModalOuvert(true)}>+ Tâche</Button>}>
      <div className="flex gap-2 mb-4">
        {[["today", "Aujourd'hui"], ["toutes", "Toutes"]].map(([cle, label]) => (
          <button
            key={cle}
            onClick={() => setFiltre(cle)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              filtre === cle ? "bg-indigo text-sable" : "bg-sable-deep text-pintade-light"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {chargement && <Spinner />}
      {erreur && <p className="text-sm text-rouille">{erreur}</p>}
      {taches?.length === 0 && (
        <EmptyState
          titre="Rien à faire ici"
          description="J'ajoute une tâche pour organiser ma journée."
          action={<Button onClick={() => setModalOuvert(true)}>+ Nouvelle tâche</Button>}
        />
      )}

      <div className="flex flex-col gap-2">
        {taches?.map((t) => (
          <Card key={t.id}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={t.statut === "fait"}
                onChange={() => basculerStatut(t)}
                className="w-5 h-5 accent-indigo shrink-0"
              />
              <div className="flex-1">
                <p className={t.statut === "fait" ? "line-through text-pintade-light" : ""}>{t.description}</p>
                <p className="text-xs text-pintade-light">
                  {formaterDate(t.date)} {t.bande && `· ${t.bande.code}`} {t.recurrence && `· ${t.recurrence}`}
                </p>
              </div>
            </label>
          </Card>
        ))}
      </div>

      <ModalNouvelleTache
        ouvert={modalOuvert}
        onFermer={() => setModalOuvert(false)}
        onCree={() => { setModalOuvert(false); recharger(); }}
      />
    </AppShell>
  );
}

function ModalNouvelleTache({ ouvert, onFermer, onCree }) {
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurrence, setRecurrence] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post("/taches", { description, date, recurrence: recurrence || undefined });
      setDescription("");
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="J'ajoute une tâche" ouvert={ouvert} onFermer={onFermer}>
      <form onSubmit={gererEnvoi}>
        <Champ label="Description" obligatoire>
          <ChampTexte value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nettoyer le poulailler, commander l'aliment..." required />
        </Champ>
        <Champ label="Date" obligatoire>
          <ChampDate value={date} onChange={(e) => setDate(e.target.value)} required />
        </Champ>
        <Champ label="Récurrence">
          <ChampSelect value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            <option value="">Aucune (ponctuelle)</option>
            <option value="quotidien">Quotidienne</option>
            <option value="hebdomadaire">Hebdomadaire</option>
            <option value="mensuel">Mensuelle</option>
          </ChampSelect>
        </Champ>

        {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

        <Button type="submit" className="w-full" disabled={envoiEnCours}>
          {envoiEnCours ? "Ajout..." : "Ajouter"}
        </Button>
      </form>
    </Modal>
  );
}
