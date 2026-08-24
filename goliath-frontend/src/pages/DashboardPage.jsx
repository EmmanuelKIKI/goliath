// Mon tableau de bord : la première chose que je vois en me
// connectant. Je regroupe ici tout ce qui compte pour ma journée,
// sans avoir à naviguer dans chaque module séparément.

import { Link } from "react-router-dom";
import { TriangleAlert, Syringe, ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";
import Card from "../components/Card";
import StatTile from "../components/StatTile";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import { useApi } from "../hooks/useApi";
import api from "../lib/api";
import { formaterMontant, formaterDateCourte } from "../lib/format";

export default function DashboardPage() {
  const { donnees, chargement, erreur } = useApi(
    () => api.get("/dashboard").then((r) => r.data.tableauDeBord),
    []
  );

  return (
    <AppShell titre="Mon tableau de bord">
      {chargement && <Spinner />}

      {erreur && (
        <Card accent="rouille" className="mb-4">
          <p className="text-sm text-rouille">{erreur}</p>
        </Card>
      )}

      {donnees && (
        <div className="flex flex-col gap-4">
          {/* Mes deux chiffres principaux */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Bandes actives" valeur={donnees.nombreBandesActives} couleur="indigo" />
            <StatTile label="Effectif total" valeur={donnees.effectifTotal} couleur="pintade" />
          </div>

          {/* Ma rentabilité du mois */}
          <Card accent={donnees.finances.margeNetteDuMois >= 0 ? "feuille" : "rouille"}>
            <p className="text-xs uppercase tracking-wide text-pintade-light font-medium mb-1">
              Marge nette de mon mois en cours
            </p>
            <p className={`font-display chiffre text-3xl font-semibold ${donnees.finances.margeNetteDuMois >= 0 ? "text-feuille" : "text-rouille"}`}>
              {formaterMontant(donnees.finances.margeNetteDuMois)}
            </p>
            <div className="flex gap-4 mt-2 text-sm text-pintade-light">
              <span>Revenus : <span className="chiffre">{formaterMontant(donnees.finances.revenusDuMois)}</span></span>
              <span>Dépenses : <span className="chiffre">{formaterMontant(donnees.finances.depensesDuMois)}</span></span>
            </div>
          </Card>

          {/* Mes alertes de stock */}
          {donnees.alertes.stocksEnAlerte.length > 0 && (
            <Card accent="rouille">
              <p className="font-display font-semibold mb-2 flex items-center gap-2">
                <TriangleAlert size={18} className="text-rouille" aria-hidden="true" />
                Mes stocks bas
              </p>
              <ul className="flex flex-col gap-2">
                {donnees.alertes.stocksEnAlerte.map((article) => (
                  <li key={article.id} className="flex justify-between text-sm">
                    <span>{article.nom}</span>
                    <span className="chiffre text-rouille">
                      {article.quantiteActuelle} {article.unite}
                    </span>
                  </li>
                ))}
              </ul>
              <Link to="/stocks" className="text-sm text-indigo font-medium mt-3 inline-flex items-center gap-1">
                Voir mes stocks <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </Card>
          )}

          {/* Mes vaccinations à venir */}
          {donnees.alertes.vaccinationsAVenir.length > 0 && (
            <Card accent="mais">
              <p className="font-display font-semibold mb-2 flex items-center gap-2">
                <Syringe size={18} className="text-mais-dark" aria-hidden="true" />
                Mes vaccinations à venir
              </p>
              <ul className="flex flex-col gap-2">
                {donnees.alertes.vaccinationsAVenir.map((vacc) => (
                  <li key={vacc.id} className="flex justify-between text-sm">
                    <span>{vacc.nomVaccin} — {vacc.bande.code}</span>
                    <span className="chiffre">{formaterDateCourte(vacc.datePrevue)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Mes tâches du jour */}
          <Card accent="indigo">
            <p className="font-display font-semibold mb-2">Mes tâches du jour</p>
            {donnees.tachesDuJour.length === 0 ? (
              <EmptyState
                titre="Rien de prévu aujourd'hui"
                description="Je peux ajouter une tâche pour organiser ma journée."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {donnees.tachesDuJour.map((tache) => (
                  <li key={tache.id} className="flex items-center justify-between text-sm">
                    <span className={tache.statut === "fait" ? "line-through text-pintade-light" : ""}>
                      {tache.description}
                    </span>
                    <Badge tone={tache.statut === "fait" ? "feuille" : "neutre"}>
                      {tache.statut === "fait" ? "Fait" : "À faire"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/taches" className="text-sm text-indigo font-medium mt-3 inline-flex items-center gap-1">
              Voir toutes mes tâches <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
