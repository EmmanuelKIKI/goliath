// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import { ToastProvider } from "./hooks/useToast.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DailyTracking from "./pages/DailyTracking.jsx";
import History from "./pages/History.jsx";
import Statistics from "./pages/Statistics.jsx";
import HealthAssistant from "./pages/HealthAssistant.jsx";
import Settings from "./pages/Settings.jsx";
import Conflicts from "./pages/Conflicts.jsx";
import FarmLayout from "./pages/ferme/FarmLayout.jsx";
import Buildings from "./pages/ferme/Buildings.jsx";
import Lots from "./pages/ferme/Lots.jsx";
import Weight from "./pages/ferme/Weight.jsx";
import Purchases from "./pages/ferme/Purchases.jsx";
import LoadingState from "./components/LoadingState.jsx";

function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingState label="Chargement de GOLIATH…" />;
  if (!session) return <Navigate to="/connexion" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/connexion" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/tableau-de-bord" replace />} />
        <Route path="/tableau-de-bord" element={<Dashboard />} />
        <Route path="/suivi-du-jour" element={<DailyTracking />} />
        <Route path="/historique" element={<History />} />
        <Route path="/statistiques" element={<Statistics />} />
        <Route path="/assistant-sante" element={<HealthAssistant />} />
        <Route path="/ma-ferme" element={<FarmLayout />}>
          <Route index element={<Navigate to="batiments" replace />} />
          <Route path="batiments" element={<Buildings />} />
          <Route path="lots" element={<Lots />} />
          <Route path="poids" element={<Weight />} />
          <Route path="achats" element={<Purchases />} />
        </Route>
        <Route path="/parametres" element={<Settings />} />
        <Route path="/parametres/conflits" element={<Conflicts />} />
        <Route path="*" element={<Navigate to="/tableau-de-bord" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
