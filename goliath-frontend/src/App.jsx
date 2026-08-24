// C'est ici que je définis toutes les pages de mon app et leurs URLs.
// Je protège toutes mes pages sauf la connexion avec RouteProtegee.

import { Routes, Route } from "react-router-dom";
import RouteProtegee from "./components/RouteProtegee";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BandesListPage from "./pages/BandesListPage";
import BandeDetailPage from "./pages/BandeDetailPage";
import StocksPage from "./pages/StocksPage";
import FinancesPage from "./pages/FinancesPage";
import ClientsVentesPage from "./pages/ClientsVentesPage";
import TachesPage from "./pages/TachesPage";
import ParametresPage from "./pages/ParametresPage";

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<LoginPage />} />

      <Route path="/" element={<RouteProtegee><DashboardPage /></RouteProtegee>} />
      <Route path="/bandes" element={<RouteProtegee><BandesListPage /></RouteProtegee>} />
      <Route path="/bandes/:id" element={<RouteProtegee><BandeDetailPage /></RouteProtegee>} />
      <Route path="/stocks" element={<RouteProtegee><StocksPage /></RouteProtegee>} />
      <Route path="/finances" element={<RouteProtegee><FinancesPage /></RouteProtegee>} />
      <Route path="/clients-ventes" element={<RouteProtegee><ClientsVentesPage /></RouteProtegee>} />
      <Route path="/taches" element={<RouteProtegee><TachesPage /></RouteProtegee>} />
      <Route path="/parametres" element={<RouteProtegee><ParametresPage /></RouteProtegee>} />
    </Routes>
  );
}
