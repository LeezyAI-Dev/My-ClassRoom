// Stockage durable des fichiers envoyés (bannière, EYES, PDF) sur Cloudinary.
//
// Pourquoi : sur le plan gratuit de Render le disque est éphémère. Tout fichier écrit dans
// backend/uploads disparaît au redémarrage, alors que sa ligne reste dans la base : l'image
// « se casse ». Cloudinary garde les fichiers de façon permanente et les sert via une adresse https.
//
// Aucune dépendance npm : on appelle directement l'API REST (Node 18+ : fetch, FormData, Blob).
// Variables d'environnement requises (backend/.env ET Render → Environment) :
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Marqueur stocké dans la colonne file_path : "cld|<type>|<public_id>".
// Les anciennes lignes (nom de fichier simple) restent reconnues comme fichiers locaux.
const MARKER = "cld";

function getConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    throw new Error(
      "Stockage de fichiers non configuré (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
    );
  }
  return { cloud, key, secret };
}

// Signature Cloudinary : paramètres triés, "k=v" joints par "&", + secret, puis SHA-1.
// (file, api_key, resource_type et cloud_name ne sont jamais signés.)
function sign(params, secret) {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + secret).digest("hex");
}

async function fileToBlob(filePath, mimeType) {
  if (typeof fs.openAsBlob === "function") return fs.openAsBlob(filePath, { type: mimeType });
  return new Blob([await fs.promises.readFile(filePath)], { type: mimeType });
}

/**
 * Envoie un fichier local (le fichier temporaire de multer) vers Cloudinary.
 * @returns {{ url: string, storedPath: string }} url https permanente + valeur à garder dans file_path
 */
async function uploadLocalFile(filePath, { folder, mimeType, originalName }) {
  const { cloud, key, secret } = getConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ folder, timestamp }, secret);

  const form = new FormData();
  form.append("file", await fileToBlob(filePath, mimeType), originalName || path.basename(filePath));
  form.append("api_key", key);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
    method: "POST",
    body: form,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.secure_url) {
    const reason = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`Échec de l'envoi vers Cloudinary : ${reason}`);
  }

  return {
    url: data.secure_url,
    storedPath: `${MARKER}|${data.resource_type}|${data.public_id}`,
  };
}

function isCloudStored(storedPath) {
  return typeof storedPath === "string" && storedPath.startsWith(`${MARKER}|`);
}

/** Supprime un fichier Cloudinary à partir de la valeur stockée dans file_path. Jamais bloquant. */
async function deleteStored(storedPath) {
  if (!isCloudStored(storedPath)) return;
  try {
    const { cloud, key, secret } = getConfig();
    const [, resourceType, ...rest] = storedPath.split("|");
    const publicId = rest.join("|");
    const timestamp = Math.floor(Date.now() / 1000);
    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", key);
    form.append("timestamp", String(timestamp));
    form.append("signature", sign({ public_id: publicId, timestamp }, secret));
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/destroy`, {
      method: "POST",
      body: form,
    });
  } catch (err) {
    console.error("Suppression Cloudinary ignorée :", err.message);
  }
}

module.exports = { uploadLocalFile, deleteStored, isCloudStored, sign };
