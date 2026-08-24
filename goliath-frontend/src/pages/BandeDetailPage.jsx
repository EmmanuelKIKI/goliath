// La fiche complète d'une bande précise. Je regroupe ici tout ce qui
// la concerne : son journal sanitaire, ses vaccinations, sa courbe de
// mortalité, ses mouvements de stock liés, ses transactions
// financières et ses tâches. Je navigue entre ces vues avec des
// onglets pour ne pas tout afficher en même temps sur mon téléphone.

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { Champ, ChampTexte, ChampNombre, ChampDate, ChampSelect } from "../components/Champs";
import { useApi } from "../hooks/useApi";
import api, { extraireMessageErreur } from "../lib/api";
import { formaterDate, formaterMontant, formaterDateCourte } from "../lib/format";

const ONGLETS = ["Santé", "Mortalité", "Stock lié", "Finances liées", "Tâches"];

export default function BandeDetailPage() {
  const { id } = useParams();
  const [ongletActif, setOngletActif] = useState("Santé");

  const { donnees: bande, chargement, erreur, recharger } = useApi(
    () => api.get(`/bandes/${id}`).then((r) => r.data.bande),
    [id]
  );

  const { donnees: mortalite } = useApi(
    () => api.get(`/bandes/${id}/mortalite`).then((r) => r.data),
    [id]
  );

  if (chargement) {
    return (
      <AppShell titre="Ma bande">
        <Spinner />
      </AppShell>
    );
  }

  if (erreur || !bande) {
    return (
      <AppShell titre="Ma bande">
        <p className="text-sm text-rouille">{erreur || "Je ne retrouve pas cette bande."}</p>
      </AppShell>
    );
  }

  return (
    <AppShell titre={bande.code}>
      <Card className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-pintade-light">
              Arrivée le {formaterDate(bande.dateArrivee)} · {bande.origine}
            </p>
            <Badge tone={bande.statut === "actif" ? "feuille" : "neutre"}>
              {bande.statut === "actif" ? "Active" : "Archivée"}
            </Badge>
          </div>
          <div className="text-right">
            <p className="chiffre text-2xl font-semibold">{bande.effectifActuel}</p>
            <p className="text-xs text-pintade-light">sur {bande.effectifInitial} au départ</p>
          </div>
        </div>
      </Card>

      {/* Mes onglets, défilables horizontalement sur petit écran */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {ONGLETS.map((onglet) => (
          <button
            key={onglet}
            onClick={() => setOngletActif(onglet)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium ${
              ongletActif === onglet ? "bg-indigo text-sable" : "bg-sable-deep text-pintade-light"
            }`}
          >
            {onglet}
          </button>
        ))}
      </div>

      {ongletActif === "Santé" && <OngletSante bandeId={id} bande={bande} recharger={recharger} />}
      {ongletActif === "Mortalité" && <OngletMortalite mortalite={mortalite} />}
      {ongletActif === "Stock lié" && <OngletStockLie mouvements={bande.mouvementsStock} />}
      {ongletActif === "Finances liées" && <OngletFinancesLiees bandeId={id} transactions={bande.transactions} />}
      {ongletActif === "Tâches" && <OngletTaches bandeId={id} taches={bande.taches} />}
    </AppShell>
  );
}

// --- Onglet Santé : journal sanitaire + vaccinations ---
function OngletSante({ bandeId, bande, recharger }) {
  const [modalEvenement, setModalEvenement] = useState(false);
  const [modalVaccin, setModalVaccin] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button onClick={() => setModalEvenement(true)} className="flex-1">+ Événement sanitaire</Button>
        <Button variant="secondaire" onClick={() => setModalVaccin(true)} className="flex-1">+ Vaccination</Button>
      </div>

      <div>
        <p className="font-display font-semibold mb-2">Mon journal sanitaire</p>
        {bande.journalSanitaire.length === 0 ? (
          <EmptyState titre="Aucun événement enregistré" />
        ) : (
          <div className="flex flex-col gap-2">
            {bande.journalSanitaire.map((evt) => (
              <Card key={evt.id} accent={evt.type === "deces" ? "rouille" : "indigo"}>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge tone={evt.type === "deces" ? "rouille" : "indigo"}>{evt.type}</Badge>
                    {evt.description && <p className="text-sm mt-1">{evt.description}</p>}
                  </div>
                  <div className="text-right text-sm text-pintade-light">
                    <p>{formaterDateCourte(evt.date)}</p>
                    {evt.nombreConcerne && <p className="chiffre">{evt.nombreConcerne} sujets</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="font-display font-semibold mb-2">Mon calendrier de vaccination</p>
        {bande.planningVaccination.length === 0 ? (
          <EmptyState titre="Aucune vaccination planifiée" />
        ) : (
          <div className="flex flex-col gap-2">
            {bande.planningVaccination.map((v) => (
              <Card key={v.id} accent="mais">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{v.nomVaccin}</p>
                    <p className="text-xs text-pintade-light">Prévue le {formaterDate(v.datePrevue)}</p>
                  </div>
                  <Badge tone={v.statut === "faite" ? "feuille" : v.statut === "en_retard" ? "rouille" : "mais"}>
                    {v.statut}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ModalEvenementSanitaire
        bandeId={bandeId}
        ouvert={modalEvenement}
        onFermer={() => setModalEvenement(false)}
        onCree={() => { setModalEvenement(false); recharger(); }}
      />
      <ModalVaccination
        bandeId={bandeId}
        ouvert={modalVaccin}
        onFermer={() => setModalVaccin(false)}
        onCree={() => { setModalVaccin(false); recharger(); }}
      />
    </div>
  );
}

function ModalEvenementSanitaire({ bandeId, ouvert, onFermer, onCree }) {
  const [date, setDate] = useState("");
  const [type, setType] = useState("vaccination");
  const [description, setDescription] = useState("");
  const [nombreConcerne, setNombreConcerne] = useState("");
  const [cout, setCout] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post(`/bandes/${bandeId}/journal-sanitaire`, {
        date, type, description, nombreConcerne: nombreConcerne || undefined, cout: cout || undefined,
      });
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="J'ajoute un événement sanitaire" ouvert={ouvert} onFermer={onFermer}>
      <form onSubmit={gererEnvoi}>
        <Champ label="Date" obligatoire><ChampDate value={date} onChange={(e) => setDate(e.target.value)} required /></Champ>
        <Champ label="Type" obligatoire>
          <ChampSelect value={type} onChange={(e) => setType(e.target.value)}>
            <option value="vaccination">Vaccination</option>
            <option value="maladie">Maladie</option>
            <option value="traitement">Traitement</option>
            <option value="deces">Décès</option>
          </ChampSelect>
        </Champ>
        <Champ label="Nombre de sujets concernés">
          <ChampNombre value={nombreConcerne} onChange={(e) => setNombreConcerne(e.target.value)} min="0" />
        </Champ>
        <Champ label="Coût (FCFA)">
          <ChampNombre value={cout} onChange={(e) => setCout(e.target.value)} min="0" />
        </Champ>
        <Champ label="Description">
          <ChampTexte value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détails de l'événement..." />
        </Champ>

        {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

        <Button type="submit" className="w-full" disabled={envoiEnCours}>
          {envoiEnCours ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Modal>
  );
}

function ModalVaccination({ bandeId, ouvert, onFermer, onCree }) {
  const [nomVaccin, setNomVaccin] = useState("");
  const [datePrevue, setDatePrevue] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post("/vaccinations", { bandeId, nomVaccin, datePrevue });
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="Je planifie une vaccination" ouvert={ouvert} onFermer={onFermer}>
      <form onSubmit={gererEnvoi}>
        <Champ label="Nom du vaccin" obligatoire>
          <ChampTexte value={nomVaccin} onChange={(e) => setNomVaccin(e.target.value)} required />
        </Champ>
        <Champ label="Date prévue" obligatoire>
          <ChampDate value={datePrevue} onChange={(e) => setDatePrevue(e.target.value)} required />
        </Champ>

        {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

        <Button type="submit" className="w-full" disabled={envoiEnCours}>
          {envoiEnCours ? "Planification..." : "Planifier"}
        </Button>
      </form>
    </Modal>
  );
}

// --- Onglet Mortalité : courbe + chiffres clés ---
function OngletMortalite({ mortalite }) {
  if (!mortalite) return <Spinner />;

  const donneesGraphique = mortalite.courbe.map((point) => ({
    date: formaterDateCourte(point.date),
    "Décès cumulés": point.decesCumules,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Card accent="rouille">
          <p className="text-xs uppercase text-pintade-light font-medium mb-1">Taux de mortalité</p>
          <p className="chiffre text-2xl font-semibold text-rouille">{mortalite.tauxMortalite}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-pintade-light font-medium mb-1">Total décès</p>
          <p className="chiffre text-2xl font-semibold">{mortalite.totalDeces}</p>
        </Card>
      </div>

      <Card>
        <p className="font-display font-semibold mb-3">Évolution de ma mortalité</p>
        {donneesGraphique.length === 0 ? (
          <EmptyState titre="Pas encore assez de données pour un graphique" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={donneesGraphique}>
              <CartesianGrid stroke="#E4DCC5" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#37473D" />
              <YAxis tick={{ fontSize: 11 }} stroke="#37473D" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="Décès cumulés" stroke="#B44324" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

// --- Onglet Stock lié ---
function OngletStockLie({ mouvements }) {
  if (mouvements.length === 0) return <EmptyState titre="Aucun mouvement de stock lié à cette bande" />;

  return (
    <div className="flex flex-col gap-2">
      {mouvements.map((m) => (
        <Card key={m.id}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{m.article?.nom}</p>
              <p className="text-xs text-pintade-light">{formaterDateCourte(m.date)}</p>
            </div>
            <p className={`chiffre font-semibold ${m.type === "sortie" ? "text-rouille" : "text-feuille"}`}>
              {m.type === "sortie" ? "-" : "+"}{m.quantite} {m.article?.unite}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

// --- Onglet Finances liées ---
function OngletFinancesLiees({ bandeId }) {
  const { donnees: rentabilite, chargement } = useApi(
    () => api.get(`/finances/rentabilite/${bandeId}`).then((r) => r.data),
    [bandeId]
  );

  if (chargement) return <Spinner />;
  if (!rentabilite) return null;

  return (
    <div className="flex flex-col gap-3">
      <Card accent={rentabilite.margeNette >= 0 ? "feuille" : "rouille"}>
        <p className="text-xs uppercase text-pintade-light font-medium mb-1">Marge nette de cette bande</p>
        <p className={`chiffre text-2xl font-semibold ${rentabilite.margeNette >= 0 ? "text-feuille" : "text-rouille"}`}>
          {formaterMontant(rentabilite.margeNette)}
        </p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs uppercase text-pintade-light font-medium mb-1">Dépenses totales</p>
          <p className="chiffre text-lg font-semibold">{formaterMontant(rentabilite.totalDepenses)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-pintade-light font-medium mb-1">Coût par poulet</p>
          <p className="chiffre text-lg font-semibold">{formaterMontant(rentabilite.coutRevientParPoulet)}</p>
        </Card>
      </div>
      <Link to="/finances" className="text-sm text-indigo font-medium inline-flex items-center gap-1">
        Voir toutes mes finances <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

// --- Onglet Tâches ---
function OngletTaches({ taches }) {
  if (taches.length === 0) return <EmptyState titre="Aucune tâche liée à cette bande" />;

  return (
    <div className="flex flex-col gap-2">
      {taches.map((t) => (
        <Card key={t.id}>
          <div className="flex justify-between items-center">
            <span className={t.statut === "fait" ? "line-through text-pintade-light" : ""}>{t.description}</span>
            <Badge tone={t.statut === "fait" ? "feuille" : "neutre"}>{t.statut === "fait" ? "Fait" : "À faire"}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
