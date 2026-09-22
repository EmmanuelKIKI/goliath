// src/services/imageCompression.js
// Compression côté client avant tout upload : redimensionnement (1600px de
// large max) et réduction de qualité JPEG (~80%) via canvas. Le backend ne
// doit jamais recevoir une photo brute non compressée.

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.8;

export async function compressImage(file) {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );

  return new File([blob], renameToJpg(file.name), { type: "image/jpeg" });
}

function renameToJpg(originalName) {
  const base = originalName.replace(/\.[^.]+$/, "");
  return `${base}.jpg`;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function isAcceptedImageType(file) {
  return ACCEPTED_TYPES.includes(file.type);
}
