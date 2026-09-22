// src/hooks/useAuth.jsx
// Le frontend ne crée jamais de compte et ne connaît jamais les
// identifiants internes de l'utilisateur unique. Il envoie uniquement le
// code saisi à l'Edge Function auth-login, puis injecte les jetons reçus
// via supabase.auth.setSession(). Le rafraîchissement est ensuite natif à
// supabase-js.

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, edgeFunctionUrl } from "../services/supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (code) => {
    const response = await fetch(edgeFunctionUrl("auth-login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || "Code d'accès incorrect.");
    }

    const { error } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });

    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider.");
  return ctx;
}
