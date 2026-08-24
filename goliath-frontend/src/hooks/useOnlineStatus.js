// Ce petit hook me permet d'afficher un bandeau clair quand je perds
// ma connexion, plutôt que de laisser mes formulaires planter sans
// explication. Important pour moi puisque ma ferme est en zone où le
// réseau n'est pas toujours stable.

import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [enLigne, setEnLigne] = useState(navigator.onLine);

  useEffect(() => {
    function gererEnLigne() {
      setEnLigne(true);
    }
    function gererHorsLigne() {
      setEnLigne(false);
    }

    window.addEventListener("online", gererEnLigne);
    window.addEventListener("offline", gererHorsLigne);

    return () => {
      window.removeEventListener("online", gererEnLigne);
      window.removeEventListener("offline", gererHorsLigne);
    };
  }, []);

  return enLigne;
}
