// J'utilise ce hook dans presque toutes mes pages : il m'évite de
// réécrire à chaque fois la même logique de "charger, gérer le
// chargement, gérer l'erreur". Je lui passe une fonction qui fait
// l'appel API, et un tableau de dépendances comme avec useEffect.

import { useCallback, useEffect, useState } from "react";
import { extraireMessageErreur } from "../lib/api";

export function useApi(fonctionAppel, dependances = []) {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const resultat = await fonctionAppel();
      setDonnees(resultat);
    } catch (e) {
      setErreur(extraireMessageErreur(e));
    } finally {
      setChargement(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependances);

  useEffect(() => {
    recharger();
  }, [recharger]);

  return { donnees, chargement, erreur, recharger };
}
