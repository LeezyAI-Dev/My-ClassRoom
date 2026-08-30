const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Une erreur est survenue.");
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
