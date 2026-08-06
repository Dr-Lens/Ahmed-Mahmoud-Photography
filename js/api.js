import { CONFIG } from "./config.js";
import { store } from "./state.js";

/**
 * Thin client for the Google Apps Script Web App backend.
 *
 * Public reads use GET with query params (cache-friendly, no auth).
 * Everything else (login, and every admin mutation) is sent as a POST with
 * a `text/plain` body containing a JSON envelope. Apps Script Web Apps do
 * not support custom PUT/DELETE verbs cleanly from the browser, and a
 * `text/plain` POST avoids a CORS preflight — the *method* (create, update,
 * delete, publish, ...) travels inside the JSON body instead of the HTTP verb.
 *
 * Authorization for every protected call is the opaque session token issued
 * at login. The frontend never decides what it's allowed to do — Apps Script
 * re-validates the token against the Sessions sheet on every request.
 */

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function getRequest(params = {}) {
  const url = new URL(CONFIG.API_BASE_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { method: "GET" });
  return parseResponse(res);
}

async function postAction(action, payload = {}, { auth = false } = {}) {
  const session = store.get("session");
  const body = {
    action,
    payload,
    token: auth ? session?.token || null : undefined,
  };
  const res = await fetch(CONFIG.API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  });
  return parseResponse(res, { onUnauthorized: () => store.clearSession() });
}

async function parseResponse(res, { onUnauthorized } = {}) {
  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("The server returned an unexpected response.", res.status, "PARSE_ERROR");
  }
  if (!res.ok || json.ok === false) {
    const status = json.status || res.status;
    if (status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(json.error || "Something went wrong.", status, json.code);
  }
  return json.data;
}

export const api = {
  ApiError,

  /* ---------------- Public reads ---------------- */
  getPublishedWeddings: (eventType) =>
    getRequest({ resource: "weddings", published: "true", ...(eventType ? { eventType } : {}) }),

  // Photos are embedded in the wedding payload (nested under sections),
  // assembled server-side by Weddings.gs — no separate photos endpoint
  // is needed for the public site.
  getWeddingBySlug: (slug) => getRequest({ resource: "wedding", slug, published: "true" }),

  getSettings: () => getRequest({ resource: "settings" }),

  /* ---------------- Auth ---------------- */
  login: (email, password) => postAction("login", { email, password }),
  logout: () => postAction("logout", {}, { auth: true }),
  getSession: () => postAction("session", {}, { auth: true }),
  changePassword: (currentPassword, newPasswordHash, newSalt) =>
    postAction("changePassword", { currentPassword, newPasswordHash, newSalt }, { auth: true }),

  /* ---------------- Admin: weddings ---------------- */
  listWeddingsAdmin: () => postAction("listWeddings", {}, { auth: true }),
  getWeddingAdmin: (id) => postAction("getWedding", { id }, { auth: true }),
  createWedding: (data) => postAction("createWedding", data, { auth: true }),
  updateWedding: (id, data) => postAction("updateWedding", { id, ...data }, { auth: true }),
  deleteWedding: (id) => postAction("deleteWedding", { id }, { auth: true }),
  setPublishState: (id, published) => postAction("setPublishState", { id, published }, { auth: true }),
  setFeatured: (id, featured) => postAction("setFeatured", { id, featured }, { auth: true }),
  setCoverImage: (id, coverImage) => postAction("setCoverImage", { id, coverImage }, { auth: true }),

  /* ---------------- Admin: sections ---------------- */
  createSection: (weddingId, data) => postAction("createSection", { weddingId, ...data }, { auth: true }),
  updateSection: (id, data) => postAction("updateSection", { id, ...data }, { auth: true }),
  deleteSection: (id) => postAction("deleteSection", { id }, { auth: true }),
  reorderSections: (weddingId, orderedIds) =>
    postAction("reorderSections", { weddingId, orderedIds }, { auth: true }),

  /* ---------------- Admin: photos ---------------- */
  // ImgBB upload is mediated by Apps Script so the API key never reaches the browser.
  uploadPhoto: (base64Image, meta) => postAction("uploadPhoto", { image: base64Image, ...meta }, { auth: true }),
  deletePhoto: (id) => postAction("deletePhoto", { id }, { auth: true }),
  reorderPhotos: (sectionId, orderedIds) =>
    postAction("reorderPhotos", { sectionId, orderedIds }, { auth: true }),
  updatePhotoCaption: (id, caption) => postAction("updatePhotoCaption", { id, caption }, { auth: true }),
};
