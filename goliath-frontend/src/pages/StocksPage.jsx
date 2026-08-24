// Ma page de gestion de stock : mes articles (aliments, médicaments,
// litière) et mes mouvements d'entrée/sortie. C'est ce module qui
// m'évite de me retrouver à court d'aliment sans l'avoir vu venir.

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
import { formaterDateCourte } from "../lib/format";

const CATEGORIES = ["aliment", "medicament", "litiere", "autre"];

export default function StocksPage() {
  const [vue, setVue] = useState("articles");
  const [modalArticle, setModalArticle] = useState(false);
  const [modalMouvement, setModalMouvement] = useState(false);

  const { donnees: articles, chargement: chargeArticles, recharger: rechargerArticles } = useApi(
    () => api.get("/stocks/articles").then((r) => r.data.articles),
    []
  );

  const { donnees: mouvements, chargement: chargeMouvements, recharger: rechargerMouvements } = useApi(
    () => api.get("/stocks/mouvements").then((r) => r.data.mouvements),
    []
  );

  function toutRecharger() {
    rechargerArticles();
    rechargerMouvements();
  }

  return (
    <AppShell
      titre="Mes stocks"
      actions={
        <Button onClick={() => (vue === "articles" ? setModalArticle(true) : setModalMouvement(true))}>
          + {vue === "articles" ? "Article" : "Mouvement"}
        </Button>
      }
    >
      <div className="flex gap-2 mb-4">
        {[["articles", "Mes articles"], ["mouvements", "Mes mouvements"]].map(([cle, label]) => (
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

      {vue === "articles" && (
        <>
          {chargeArticles && <Spinner />}
          {articles?.length === 0 && (
            <EmptyState
              titre="Aucun article dans mon stock"
              description="J'ajoute mon premier article pour commencer mon suivi."
              action={<Button onClick={() => setModalArticle(true)}>+ Nouvel article</Button>}
            />
          )}
          <div className="flex flex-col gap-2">
            {articles?.map((article) => (
              <Card key={article.id} accent={article.enAlerte ? "rouille" : "mais"}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{article.nom}</p>
                    <p className="text-xs text-pintade-light capitalize">{article.categorie}</p>
                  </div>
                  <div className="text-right">
                    <p className="chiffre font-semibold">{article.quantiteActuelle} {article.unite}</p>
                    {article.enAlerte && <Badge tone="rouille">Stock bas</Badge>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {vue === "mouvements" && (
        <>
          {chargeMouvements && <Spinner />}
          {mouvements?.length === 0 && <EmptyState titre="Aucun mouvement enregistré" />}
          <div className="flex flex-col gap-2">
            {mouvements?.map((m) => (
              <Card key={m.id}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{m.article.nom}</p>
                    <p className="text-xs text-pintade-light">
                      {formaterDateCourte(m.date)} {m.bande && `· ${m.bande.code}`}
                    </p>
                  </div>
                  <p className={`chiffre font-semibold ${m.type === "sortie" ? "text-rouille" : "text-feuille"}`}>
                    {m.type === "sortie" ? "-" : "+"}{m.quantite} {m.article.unite}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ModalNouvelArticle
        ouvert={modalArticle}
        onFermer={() => setModalArticle(false)}
        onCree={() => { setModalArticle(false); toutRecharger(); }}
      />
      <ModalNouveauMouvement
        articles={articles || []}
        ouvert={modalMouvement}
        onFermer={() => setModalMouvement(false)}
        onCree={() => { setModalMouvement(false); toutRecharger(); }}
      />
    </AppShell>
  );
}

function ModalNouvelArticle({ ouvert, onFermer, onCree }) {
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState("aliment");
  const [unite, setUnite] = useState("");
  const [seuilAlerte, setSeuilAlerte] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post("/stocks/articles", { nom, categorie, unite, seuilAlerte });
      setNom(""); setUnite(""); setSeuilAlerte("");
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="J'ajoute un article de stock" ouvert={ouvert} onFermer={onFermer}>
      <form onSubmit={gererEnvoi}>
        <Champ label="Nom" obligatoire>
          <ChampTexte value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Aliment croissance, vaccine Newcastle..." required />
        </Champ>
        <Champ label="Catégorie" obligatoire>
          <ChampSelect value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </ChampSelect>
        </Champ>
        <Champ label="Unité" obligatoire>
          <ChampTexte value={unite} onChange={(e) => setUnite(e.target.value)} placeholder="kg, sac, dose..." required />
        </Champ>
        <Champ label="Seuil d'alerte">
          <ChampNombre value={seuilAlerte} onChange={(e) => setSeuilAlerte(e.target.value)} min="0" />
        </Champ>

        {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

        <Button type="submit" className="w-full" disabled={envoiEnCours}>
          {envoiEnCours ? "Création..." : "Ajouter"}
        </Button>
      </form>
    </Modal>
  );
}

function ModalNouveauMouvement({ articles, ouvert, onFermer, onCree }) {
  const [articleId, setArticleId] = useState("");
  const [type, setType] = useState("entree");
  const [quantite, setQuantite] = useState("");
  const [coutUnitaire, setCoutUnitaire] = useState("");
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  async function gererEnvoi(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoiEnCours(true);
    try {
      await api.post("/stocks/mouvements", { articleId, type, quantite, coutUnitaire: coutUnitaire || undefined });
      setArticleId(""); setQuantite(""); setCoutUnitaire("");
      onCree();
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <Modal titre="J'enregistre un mouvement de stock" ouvert={ouvert} onFermer={onFermer}>
      <form onSubmit={gererEnvoi}>
        <Champ label="Article" obligatoire>
          <ChampSelect value={articleId} onChange={(e) => setArticleId(e.target.value)} required>
            <option value="">Je choisis un article...</option>
            {articles.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </ChampSelect>
        </Champ>
        <Champ label="Type" obligatoire>
          <ChampSelect value={type} onChange={(e) => setType(e.target.value)}>
            <option value="entree">Entrée (achat)</option>
            <option value="sortie">Sortie (consommation)</option>
          </ChampSelect>
        </Champ>
        <Champ label="Quantité" obligatoire>
          <ChampNombre value={quantite} onChange={(e) => setQuantite(e.target.value)} min="0.01" step="0.01" required />
        </Champ>
        {type === "entree" && (
          <Champ label="Coût unitaire (FCFA)">
            <ChampNombre value={coutUnitaire} onChange={(e) => setCoutUnitaire(e.target.value)} min="0" />
          </Champ>
        )}

        {erreur && <p className="text-sm text-rouille bg-rouille/10 rounded-lg px-3 py-2 mb-4">{erreur}</p>}

        <Button type="submit" className="w-full" disabled={envoiEnCours}>
          {envoiEnCours ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Modal>
  );
}
