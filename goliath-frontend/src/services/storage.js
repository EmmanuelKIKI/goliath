// src/services/storage.js
// Upload, lecture (URL signée courte) et suppression des photos, en direct
// via supabase.storage — jamais via une Edge Function pour ça (section 2 et
// 14 du prompt frontend). Le chemin imposé {lot_id}/{uuid}.jpg ou
// sans-lot/{uuid}.jpg est celui vérifié par la policy Storage côté serveur.

import { supabase } from "./supabaseClient.js";
import { compressImage, isAcceptedImageType } from "./imageCompression.js";

const BUCKET = "ai-photos";
const SIGNED_URL_TTL_SECONDS = 600; // 10 minutes

export async function uploadPhoto(file, lotId) {
  if (!isAcceptedImageType(file)) {
    throw new Error("Format non accepté. Utilise JPG, PNG ou WebP.");
  }

  const compressed = await compressImage(file);
  const path = `${lotId ?? "sans-lot"}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) throw error;
  return path;
}

export async function getSignedPhotoUrl(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export async function deletePhoto(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
