// Ma page clients et ventes, regroupées ensemble puisqu'une vente
// n'existe pas sans client chez moi. J'enregistre mes ventes ici, et
// chaque vente crée automatiquement sa transaction financière côté
// backend, donc je n'ai rien à ressaisir dans le module finances.

import { useState } from "react";
import AppShell from "../components/AppShell";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { Champ, ChampTexte, ChampNombre, ChampSelect } from "../components/Champs";
import { useApi } from "../hooks/useApi";
import api, { extraireMessageErreur } from "../lib/api";
import { formaterMontant, formaterDateCourte } from "../lib/format";

export default function ClientsVentesPage() {
  const [vue, setVue] = useState("ventes");
  const [modalClient, setModalClient] = useState(false);
  const [modalVente, setModalVente] = useState(false);

  const { donnees: clients, recharger: rechargerClients } = useApi(
    () => api.get("/clients").then((r) => r.data.clients),
    []
  );
  const { donnees: ventes, chargement, recharger: rechargerVentes } = useApi(
    () => api.get("/ventes").then((r) => r.data.ventes),
    []
  );

  function toutRecharger() {
    rechargerClients();
    rechargerVentes();
  }

  return (
    <AppShell
      titre="Clients & ventes"
      actions={
        <Button onClick={() => (vue === "ventes" ? setModalVente(true) : setModalClient(true))}>
          + {vue === "ventes" ? "Vente" : "Client"}
        </Button>
      }
    >
      <div className="flex gap-2 mb-4">
        {[["ventes", "Mes ventes"], ["clients", "Mes clients"]].map(([cle, label]) => (
          <button
            key={cle}
            onClick={() => setVue(cle)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              vue === cle ? "bg-indigo text-sable" : "bg-sable-deep text-pintade-light"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {chargement && <Spinner />}

      {vue === "ventes" && (
        <>
          {ventes?.length === 0 && (
            <EmptyState
              titre="Aucune vente enregistrée"
              action={clients?.length > 0 ? <Button onClick={() => setModalVente(true)}>+ Nouvelle vente</Button> : null}
              description={clients?.length === 0 ? "J'ajoute d'abord un client avant de pouvoir enregistrer une vente." : undefined}
            />
          )}
          <div className="flex flex-col gap-2">
            {ventes?.map((v) => (
              <Card key={v.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{v.produit} — {v.client.nom}</p>
                    <p className="text-xs text-pintade-light">
                      {v.quantite} × {formaterMontant(v.prixUnitaire)} · {formaterDateCourte(v.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="chiffre font-semibold text-feuille">{formaterMontant(v.montantTotal)}</p>
                    <Badge tone={v.statutLivraison === "livre" ? "feuille" : v.statutLivraison === "annule" ? "rouille" : "neutre"}>
                      {v.statutLivraison.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {vue === "clients" && (
        <>
          {clients?.length === 0 && (
            <EmptyState
              titre="Aucun client enregistré"
              action={<Button onClick={() => setModalClient(true)}>+ Nouveau client</Button>}
            />
          )}
          <div className="flex flex-col gap-2">
            {clients?.map((c) => (
              <Card key={c.id}>
                <p className="font-medium">{c.nom}</p>
                {c.contact && <p className="text-sm text-pintade-light">{c.contact}</p>}
              </Card>
            ))}
          </div>
        </>
      )}

      <ModalNouveauClient
        ouvert={modalClient}
        onFermer={() => setModalClient(false)}
        onCree={() => { setModalClient(false); toutRecharger(); }}
      />
      <ModalNouvelleVente
        clients={clients || []}
        ouvert={modalVente}
        onFermer={() => setModalVente(false)}
        onCree={() => { setModalVente(false); toutRecharger(); }}
      />
    </AppShell>
  );
}

function ModalNouveauClient({ ouvert, onFermer, onCree }) {
  const [nom, setNom] = useState("");
  const [contact, setContact] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post("/clients", { nom, contact });
      setNom(""); setContact("");
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="J'ajoute un client" ouvert={ouvert} onFermer={onFermer}>
      <form onSubmit={gererEnvoi}>
        <Champ label="Nom" obligatoire>
          <ChampTexte value={nom} onChange={(e) => setNom(e.target.value)} required />
        </Champ>
        <Champ label="Contact">
          <ChampTexte value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Téléphone, WhatsApp..." />
        </Champ>

        {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

        <Button type="submit" className="w-full" disabled={envoiEnCours}>
          {envoiEnCours ? "Ajout..." : "Ajouter"}
        </Button>
      </form>
    </Modal>
  );
}

function ModalNouvelleVente({ clients, ouvert, onFermer, onCree }) {
  const [clientId, setClientId] = useState("");
  const [produit, setProduit] = useState("");
  const [quantite, setQuantite] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post("/ventes", { clientId, produit, quantite, prixUnitaire });
      setProduit(""); setQuantite(""); setPrixUnitaire("");
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="J'enregistre une vente" ouvert={ouvert} onFermer={onFermer}>
      {clients.length === 0 ? (
        <p className="text-sm text-pintade-light">J'ajoute d'abord un client avant de pouvoir enregistrer une vente.</p>
      ) : (
        <form onSubmit={gererEnvoi}>
          <Champ label="Client" obligatoire>
            <ChampSelect value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Je choisis un client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </ChampSelect>
          </Champ>
          <Champ label="Produit" obligatoire>
            <ChampTexte value={produit} onChange={(e) => setProduit(e.target.value)} placeholder="Poulet vivant, œufs..." required />
          </Champ>
          <Champ label="Quantité" obligatoire>
            <ChampNombre value={quantite} onChange={(e) => setQuantite(e.target.value)} min="0.01" step="0.01" required />
          </Champ>
          <Champ label="Prix unitaire (FCFA)" obligatoire>
            <ChampNombre value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} min="1" required />
          </Champ>

          {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

          <Button type="submit" className="w-full" disabled={envoiEnCours}>
            {envoiEnCours ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
