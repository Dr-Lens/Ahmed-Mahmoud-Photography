import { store } from "./state.js";
import { api } from "./api.js";
import { bufferToBase64, base64ToBuffer } from "./utils.js";

/**
 * IMPORTANT: this module never decides "is this user an admin". That
 * authorization decision is made exclusively by Apps Script, which
 * re-validates the session token against the Sessions sheet on every
 * protected call (see /apps-script/Auth.gs). This module only:
 *   1. helps the *setup* flow derive a PBKDF2 hash+salt for the Users sheet
 *      (so a plaintext password is never persisted anywhere), and
 *   2. manages the opaque session token for UX purposes (avoiding a flash
 *      of logged-out UI, redirecting when a token looks expired, etc).
 */

const PBKDF2_ITERATIONS = 210000;
const HASH_BITS = 256;

export async function deriveHash(password, saltBase64) {
  const enc = new TextEncoder();
  const salt = saltBase64 ? base64ToBuffer(saltBase64) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BITS
  );
  return {
    hash: bufferToBase64(bits),
    salt: bufferToBase64(salt instanceof Uint8Array ? salt.buffer : salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function login(email, password) {
  const result = await api.login(email, password);
  // result: { token, expiresAt, user: { email, role } }
  store.saveSession({
    token: result.token,
    expiresAt: result.expiresAt,
    user: result.user,
  });
  return result;
}

export async function logout() {
  try {
    await api.logout();
  } finally {
    store.clearSession();
  }
}

export function isAuthenticated() {
  return store.isAuthenticated();
}

export function currentUser() {
  return store.get("session")?.user || null;
}

/** Guards an admin page: redirects to /admin/login.html if not authenticated. */
export function requireAuth() {
  if (!isAuthenticated()) {
    const next = encodeURIComponent(location.pathname);
    location.replace(`/admin/login.html?next=${next}`);
    return false;
  }
  return true;
}

/** Verifies the session with the server (not just locally) — call on dashboard load. */
export async function verifySessionRemote() {
  try {
    await api.getSession();
    return true;
  } catch {
    store.clearSession();
    return false;
  }
}
