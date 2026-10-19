const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Une erreur est survenue.");
    err.status = res.status; // ex: 401, 429
    err.code = data.code; // ex: "WRONG_PIN", "LOCKED", "DEVICE_INVALID"
    throw err;
  }
  return data;
}

export async function registerDeveloper({ username, password, confirmPassword }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, confirmPassword }),
  });
  return handleResponse(res);
}

export async function loginDeveloper({ username, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function registerStudent({ username, password, confirmPassword }) {
  const res = await fetch(`${BASE_URL}/auth/student/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, confirmPassword }),
  });
  return handleResponse(res);
}

export async function loginStudent({ username, password }) {
  const res = await fetch(`${BASE_URL}/auth/student/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

// --- Code PIN élève ---

// Définit le code PIN (session élève requise). Renvoie { deviceToken }.
export async function setStudentPin(token, pin) {
  const res = await fetch(`${BASE_URL}/auth/student/pin/set`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pin }),
  });
  return handleResponse(res);
}

// Connexion par PIN : on envoie le jeton d'appareil. Renvoie { token, student }.
export async function loginStudentWithPin(deviceToken, pin) {
  const res = await fetch(`${BASE_URL}/auth/student/pin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${deviceToken}` },
    body: JSON.stringify({ pin }),
  });
  return handleResponse(res);
}

export async function fetchSubjects() {
  const res = await fetch(`${BASE_URL}/subjects`);
  return handleResponse(res);
}

export async function fetchSchedule() {
  const res = await fetch(`${BASE_URL}/schedule`);
  return handleResponse(res);
}

export async function createScheduleSlot(token, slot) {
  const res = await fetch(`${BASE_URL}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(slot),
  });
  return handleResponse(res);
}

export async function updateScheduleSlot(token, id, slot) {
  const res = await fetch(`${BASE_URL}/schedule/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(slot),
  });
  return handleResponse(res);
}

export async function deleteScheduleSlot(token, id) {
  const res = await fetch(`${BASE_URL}/schedule/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// --- Ressources de matière (PDF + liens) ---

export async function fetchSubjectResources(subjectId) {
  const res = await fetch(`${BASE_URL}/subjects/${subjectId}/resources`);
  return handleResponse(res);
}

export async function uploadPdfResource(token, subjectId, { title, file }) {
  const formData = new FormData();
  if (title) formData.append("title", title);
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/subjects/${subjectId}/resources/pdf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // pas de Content-Type : le navigateur le fixe (multipart + boundary)
    body: formData,
  });
  return handleResponse(res);
}

export async function addLinkResource(token, subjectId, { title, url }) {
  const res = await fetch(`${BASE_URL}/subjects/${subjectId}/resources/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, url }),
  });
  return handleResponse(res);
}

export async function deleteResource(token, resourceId) {
  const res = await fetch(`${BASE_URL}/resources/${resourceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// --- Bannière défilante de la page d'accueil ---

export async function fetchBannerImages() {
  const res = await fetch(`${BASE_URL}/banner`);
  return handleResponse(res);
}

export async function uploadBannerImage(token, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/banner`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // pas de Content-Type : le navigateur le fixe (multipart + boundary)
    body: formData,
  });
  return handleResponse(res);
}

export async function deleteBannerImage(token, imageId) {
  const res = await fetch(`${BASE_URL}/banner/${imageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// --- Comptes élèves (compte développeur) ---

export async function fetchStudents(token) {
  const res = await fetch(`${BASE_URL}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function deleteStudent(token, studentId) {
  const res = await fetch(`${BASE_URL}/students/${studentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function suspendStudent(token, studentId) {
  const res = await fetch(`${BASE_URL}/students/${studentId}/suspend`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function unsuspendStudent(token, studentId) {
  const res = await fetch(`${BASE_URL}/students/${studentId}/unsuspend`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// --- EYES (fil de photos/vidéos, élève + développeur) ---

export async function fetchEyesFeed(token) {
  const res = await fetch(`${BASE_URL}/eyes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function uploadEyesPost(token, { file, caption }) {
  const formData = new FormData();
  formData.append("file", file);
  if (caption) formData.append("caption", caption);

  const res = await fetch(`${BASE_URL}/eyes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // pas de Content-Type : le navigateur le fixe (multipart + boundary)
    body: formData,
  });
  return handleResponse(res);
}

export async function registerEyesView(token, postId) {
  const res = await fetch(`${BASE_URL}/eyes/${postId}/view`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function toggleEyesLike(token, postId) {
  const res = await fetch(`${BASE_URL}/eyes/${postId}/like`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchEyesComments(token, postId) {
  const res = await fetch(`${BASE_URL}/eyes/${postId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function addEyesComment(token, postId, content) {
  const res = await fetch(`${BASE_URL}/eyes/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

export async function deleteEyesPost(token, postId) {
  const res = await fetch(`${BASE_URL}/eyes/${postId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}


// --- Registre de notes (privé : chaque utilisateur ne voit que les siennes) ---

export async function fetchGradeCounts(token) {
  const res = await fetch(`${BASE_URL}/grades/counts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function fetchSubjectGrades(token, subjectId) {
  const res = await fetch(`${BASE_URL}/grades/subject/${subjectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

function buildGradeFormData({ score, scale, file, removePhoto }) {
  const formData = new FormData();
  formData.append("score", String(score));
  formData.append("scale", String(scale));
  if (file) formData.append("file", file);
  if (removePhoto) formData.append("removePhoto", "1");
  return formData;
}

export async function createGrade(token, subjectId, data) {
  const res = await fetch(`${BASE_URL}/grades/subject/${subjectId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // pas de Content-Type : le navigateur le fixe (multipart + boundary)
    body: buildGradeFormData(data),
  });
  return handleResponse(res);
}

export async function updateGrade(token, gradeId, data) {
  const res = await fetch(`${BASE_URL}/grades/${gradeId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: buildGradeFormData(data),
  });
  return handleResponse(res);
}

export async function deleteGrade(token, gradeId) {
  const res = await fetch(`${BASE_URL}/grades/${gradeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// La photo est protégée par le jeton : on la récupère en blob (une balise <img> ne peut pas envoyer d'en-tête).
export async function fetchGradePhotoBlob(token, gradeId) {
  const res = await fetch(`${BASE_URL}/grades/${gradeId}/photo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Photo introuvable.");
  return res.blob();
}

// --- Guide Mia (IA) ---

// Question libre au guide. Renvoie { text, screen }. Lève une erreur si l'IA est indisponible
// (quota, réseau, clé absente) : le composant retombe alors sur les réponses locales.
export async function askGuide(token, { message, screen, history }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`${BASE_URL}/guide/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message, screen, history }),
      signal: controller.signal,
    });
    return await handleResponse(res);
  } finally {
    clearTimeout(timer);
  }
}
