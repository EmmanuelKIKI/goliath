// J'enveloppe toutes mes pages privées avec ce composant. Si je ne
// suis pas connecté, je suis renvoyé directement vers la page de
// connexion plutôt que de voir une page cassée qui essaie d'appeler
// mon API sans token.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

export default function RouteProtegee({ children }) {
  const { utilisateur, chargementInitial } = useAuth();

  if (chargementInitial) {
    return <Spinner className="min-h-screen" />;
  }

  if (!utilisateur) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}
