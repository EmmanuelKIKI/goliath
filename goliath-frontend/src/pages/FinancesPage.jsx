// Ma page financière : j'enregistre mes dépenses et mes revenus,
// je consulte ma marge, et j'exporte mon rapport en CSV quand j'en
// ai besoin (par exemple pour ma banque).

import { useState } from "react";
import AppShell from "../components/AppShell";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { Champ, ChampTexte, ChampNombre, ChampSelect, ChampDate } from "../components/Champs";
import { useApi } from "../hooks/useApi";
import api, { extraireMessageErreur } from "../lib/api";
import { formaterMontant, formaterDateCourte } from "../lib/format";

export default function FinancesPage() {
  const [modalOuvert, setModalOuvert] = useState(false);

  const { donnees: transactions, chargement, erreur, recharger } = useApi(
    () => api.get("/finances/transactions").then((r) => r.data.transactions),
    []
  );

  const totalDepenses = transactions?.filter((t) => t.type === "depense").reduce((s, t) => s + t.montant, 0) || 0;
  const totalRevenus = transactions?.filter((t) => t.type === "revenu").reduce((s, t) => s + t.montant, 0) || 0;
  const margeNette = totalRevenus - totalDepenses;

  async function exporterCSV() {
    // Je récupère le fichier CSV directement depuis mon API et je
    // déclenche son téléchargement dans mon navigateur.
    const reponse = await api.get("/finances/rapport/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([reponse.data]));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "rapport-financier-goliath.csv";
    lien.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <AppShell titre="Mes finances" actions={<Button onClick={() => setModalOuvert(true)}>+ Transaction</Button>}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <p className="text-xs uppercase text-pintade-light font-medium mb-1">Revenus</p>
          <p className="chiffre text-lg font-semibold text-feuille">{formaterMontant(totalRevenus)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-pintade-light font-medium mb-1">Dépenses</p>
          <p className="chiffre text-lg font-semibold text-rouille">{formaterMontant(totalDepenses)}</p>
        </Card>
      </div>

      <Card accent={margeNette >= 0 ? "feuille" : "rouille"} className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs uppercase text-pintade-light font-medium mb-1">Ma marge nette</p>
            <p className={`chiffre text-2xl font-semibold ${margeNette >= 0 ? "text-feuille" : "text-rouille"}`}>
              {formaterMontant(margeNette)}
            </p>
          </div>
          <Button variant="secondaire" onClick={exporterCSV}>Exporter en CSV</Button>
        </div>
      </Card>

      {chargement && <Spinner />}
      {erreur && <p className="text-sm text-rouille">{erreur}</p>}
      {transactions?.length === 0 && <EmptyState titre="Aucune transaction enregistrée" />}

      <div className="flex flex-col gap-2">
        {transactions?.map((t) => (
          <Card key={t.id}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={t.type === "revenu" ? "feuille" : "rouille"}>{t.type}</Badge>
                  <span className="text-sm text-pintade-light capitalize">{t.categorie}</span>
                </div>
                {t.description && <p className="text-sm mt-1">{t.description}</p>}
                <p className="text-xs text-pintade-light mt-1">
                  {formaterDateCourte(t.date)} {t.bande && `· ${t.bande.code}`}
                </p>
              </div>
              <p className={`chiffre font-semibold ${t.type === "revenu" ? "text-feuille" : "text-rouille"}`}>
                {t.type === "revenu" ? "+" : "-"}{formaterMontant(t.montant)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <ModalNouvelleTransaction
        ouvert={modalOuvert}
        onFermer={() => setModalOuvert(false)}
        onCree={() => { setModalOuvert(false); recharger(); }}
      />
    </AppShell>
  );
}

function ModalNouvelleTransaction({ ouvert, onFermer, onCree }) {
  const [type, setType] = useState("depense");
  const [categorie, setCategorie] = useState("");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post("/finances/transactions", { type, categorie, montant, description });
      setCategorie(""); setMontant(""); setDescription("");
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="J'enregistre une transaction" ouvert={ouvert} onFermer={onFermer}>
      <form onSubmit={gererEnvoi}>
        <Champ label="Type" obligatoire>
          <ChampSelect value={type} onChange={(e) => setType(e.target.value)}>
            <option value="depense">Dépense</option>
            <option value="revenu">Revenu</option>
          </ChampSelect>
        </Champ>
        <Champ label="Catégorie" obligatoire>
          <ChampTexte value={categorie} onChange={(e) => setCategorie(e.target.value)} placeholder="Aliment, médicament, poussins..." required />
        </Champ>
        <Champ label="Montant (FCFA)" obligatoire>
          <ChampNombre value={montant} onChange={(e) => setMontant(e.target.value)} min="1" required />
        </Champ>
        <Champ label="Description">
          <ChampTexte value={description} onChange={(e) => setDescription(e.target.value)} />
        </Champ>

        {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

        <Button type="submit" className="w-full" disabled={envoiEnCours}>
          {envoiEnCours ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Modal>
  );
}
