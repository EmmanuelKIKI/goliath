// src/pages/HealthAssistant.jsx — Assistant santé (section 14)
// Le texte et l'image ne sont jamais analysés côté client : tout passe par
// les Edge Functions Gemini. Pour une photo, seul image_path est envoyé à
// ai-analyse-image, jamais le fichier brut à travers l'Edge Function.

import { useEffect, useState } from "react";
import { Stethoscope, Camera, Trash2, Loader2, ImageOff } from "lucide-react";
import { supabase } from "../services/supabaseClient.js";
import { fetchLots } from "../services/api.js";
import { uploadPhoto, getSignedPhotoUrl, deletePhoto } from "../services/storage.js";
import { formatDateTime } from "../utils/format.js";
import { SelectField, TextAreaField } from "../components/FormField.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { useToast } from "../hooks/useToast.jsx";

async function callEdgeFunction(name, body) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function HealthAssistant() {
  const { showToast } = useToast();
  const [lots, setLots] = useState([]);
  const [lotId, setLotId] = useState("");
  const [question, setQuestion] = useState("");
  const [file, setFile] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingElevage, setLoadingElevage] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    fetchLots({ onlyActive: true }).then(({ data }) => setLots(data));
    loadHistory();
  }, []);

  async function loadHistory() {
    // Historique IA : lecture directe de ai_analyses, pas d'Edge Function.
    const { data } = await supabase
      .from("ai_analyses")
      .select("*")
      .order("analysis_date", { ascending: false })
      .limit(20);
    setHistory(data ?? []);
  }

  async function handleTextAnalysis(e) {
    e.preventDefault();
    if (!navigator.onLine) {
      showToast("L'assistant IA nécessite une connexion Internet.", "error");
      return;
    }
    setLoadingText(true);
    try {
      const result = await callEdgeFunction("ai-veterinaire", { lot_id: lotId || undefined, question });
      setLastAnalysis(result.analysis);
      setQuestion("");
      loadHistory();
    } catch (err) {
      showToast(err.message || "L'assistant IA est momentanément indisponible.", "error");
    } finally {
      setLoadingText(false);
    }
  }

  async function handlePhotoAnalysis() {
    if (!file) return;
    if (!navigator.onLine) {
      showToast("L'assistant IA nécessite une connexion Internet.", "error");
      return;
    }
    setLoadingImage(true);
    try {
      const path = await uploadPhoto(file, lotId || null);
      const result = await callEdgeFunction("ai-analyse-image", {
        image_path: path,
        lot_id: lotId || undefined,
        question: question || undefined,
      });
      setLastAnalysis(result.analysis);
      setFile(null);
      loadHistory();
    } catch (err) {
      showToast(err.message || "L'assistant IA est momentanément indisponible.", "error");
    } finally {
      setLoadingImage(false);
    }
  }

  async function handleElevageAnalysis() {
    if (!navigator.onLine) {
      showToast("L'assistant IA nécessite une connexion Internet.", "error");
      return;
    }
    setLoadingElevage(true);
    try {
      const result = await callEdgeFunction("ai-analyse-elevage", { lot_id: lotId || undefined });
      setLastAnalysis(result.analysis);
      loadHistory();
    } catch (err) {
      showToast(err.message || "L'assistant IA est momentanément indisponible.", "error");
    } finally {
      setLoadingElevage(false);
    }
  }

  async function confirmDeleteAnalysis() {
    if (!toDelete) return;
    try {
      if (toDelete.image_path) await deletePhoto(toDelete.image_path);
      await supabase.from("ai_analyses").update({ image_path: null }).eq("id", toDelete.id);
      await supabase.from("ai_analyses").delete().eq("id", toDelete.id);
      showToast("Analyse supprimée.");
      loadHistory();
    } catch (err) {
      showToast("Échec de la suppression.", "error");
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-md bg-forest/10 flex items-center justify-center">
          <Stethoscope className="text-forest" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">Assistant santé</h1>
          <p className="text-sm text-muted">Décris ce que tu observes, ou ajoute une photo.</p>
        </div>
      </header>

      <div className="rounded-md bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-ink">
        Les analyses de l'assistant sont indicatives et ne remplacent pas l'examen d'un vétérinaire. En cas de
        mortalité importante ou de signes graves, contacte un professionnel.
      </div>

      <SelectField
        id="assistant-lot"
        label="Lot concerné (optionnel)"
        value={lotId}
        onChange={setLotId}
        options={lots.map((l) => ({ value: l.id, label: l.name }))}
        placeholder="Ensemble de la ferme"
      />

      <form onSubmit={handleTextAnalysis} className="space-y-3 rounded-lg bg-white border border-black/5 p-4">
        <TextAreaField id="question" label="Décris ce que j'observe…" value={question} onChange={setQuestion} rows={4} />

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-md border border-dashed border-black/20 px-3 py-2 text-sm text-muted cursor-pointer">
            <Camera size={16} />
            {file ? file.name : "Ajouter une photo"}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {file && (
            <button type="button" onClick={() => setFile(null)} className="text-muted hover:text-danger">
              <ImageOff size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loadingText || !question.trim()}
            className="flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loadingText && <Loader2 size={16} className="animate-spin" />}
            Analyser
          </button>
          {file && (
            <button
              type="button"
              onClick={handlePhotoAnalysis}
              disabled={loadingImage}
              className="flex items-center gap-2 rounded-md bg-forest/10 px-4 py-2.5 text-sm font-semibold text-forest disabled:opacity-50"
            >
              {loadingImage && <Loader2 size={16} className="animate-spin" />}
              Analyser la photo
            </button>
          )}
          <button
            type="button"
            onClick={handleElevageAnalysis}
            disabled={loadingElevage}
            className="flex items-center gap-2 rounded-md border border-forest/30 px-4 py-2.5 text-sm font-semibold text-forest disabled:opacity-50"
          >
            {loadingElevage && <Loader2 size={16} className="animate-spin" />}
            Analyser mon élevage
          </button>
        </div>
      </form>

      {lastAnalysis && (
        <section className="rounded-lg bg-white border border-forest/20 p-4">
          <p className="text-xs text-muted mb-2">{formatDateTime(lastAnalysis.analysis_date)}</p>
          <pre className="whitespace-pre-wrap font-sans text-sm text-ink">{lastAnalysis.response}</pre>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-forest mb-3">Historique</h2>
        {history.length === 0 ? (
          <LoadingState label="Aucune analyse pour l'instant." />
        ) : (
          <ul className="space-y-2">
            {history.map((a) => (
              <li key={a.id} className="rounded-md bg-white border border-black/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted">{formatDateTime(a.analysis_date)} · {a.type}</p>
                    <p className="text-sm text-ink line-clamp-2 mt-1">{a.response}</p>
                  </div>
                  <button onClick={() => setToDelete(a)} aria-label="Supprimer" className="text-muted hover:text-danger shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer cette analyse ?"
        description="La photo associée (si présente) sera aussi supprimée du stockage."
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDeleteAnalysis}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
