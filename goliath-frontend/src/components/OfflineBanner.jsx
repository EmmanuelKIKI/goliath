// J'affiche ce bandeau bien visible dès que je perds ma connexion,
// pour ne jamais me demander si mes actions vont vraiment s'enregistrer.
// Important pour moi puisque le réseau n'est pas toujours fiable
// dans ma zone.

import { useOnlineStatus } from "../hooks/useOnlineStatus";

export default function OfflineBanner() {
  const enLigne = useOnlineStatus();

  if (enLigne) return null;

  return (
    <div className="bg-rouille text-sable text-sm font-medium text-center py-2 px-4">
      Je suis hors-ligne. Je peux consulter mes dernières données, mais je ne peux rien enregistrer tant que ma connexion n'est pas revenue.
    </div>
  );
}
