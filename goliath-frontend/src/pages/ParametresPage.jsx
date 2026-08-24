// Ma page paramètres. Je regroupe ici mon profil, l'accès à mes
// clients/ventes (pas assez de place dans ma navigation du bas pour
// un 6ème onglet), et quelques informations sur l'app elle-même.

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AppShell from "../components/AppShell";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { formaterDate } from "../lib/format";

export default function ParametresPage() {
  const { utilisateur } = useAuth();

  return (
    <AppShell titre="Mes paramètres">
      <div className="flex flex-col gap-4">
        <Card>
          <p className="font-display font-semibold mb-2">Mon compte</p>
          <p className="text-sm">{utilisateur?.nom}</p>
          <p className="text-sm text-pintade-light">{utilisateur?.email}</p>
          {utilisateur?.dateCreation && (
            <p className="text-xs text-pintade-light mt-1">
              Compte créé le {formaterDate(utilisateur.dateCreation)}
            </p>
          )}
        </Card>

        <Link to="/clients-ventes">
          <Card accent="indigo">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Mes clients & ventes</p>
                <p className="text-sm text-pintade-light">Je gère mes fiches clients et j'enregistre mes ventes.</p>
              </div>
              <ChevronRight size={18} aria-hidden="true" />
            </div>
          </Card>
        </Link>

        <Card>
          <p className="font-display font-semibold mb-2">À propos de GOLIATH</p>
          <p className="text-sm text-pintade-light">
            J'ai construit cette plateforme pour gérer mon élevage de poulets Goliath au quotidien : santé,
            stocks, finances et tâches, tout en un seul endroit.
          </p>
          <p className="text-xs text-pintade-light mt-2">Version 1.0 — usage solo</p>
        </Card>

        <Card>
          <p className="font-display font-semibold mb-2">Installer l'app sur mon téléphone</p>
          <p className="text-sm text-pintade-light">
            Depuis mon navigateur mobile, je peux ajouter GOLIATH à mon écran d'accueil pour l'ouvrir comme
            une vraie application, même hors connexion pour consulter mes dernières données.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
