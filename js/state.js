import { CONFIG } from "./config.js";

/**
 * Minimal observable store. No framework — just a Map of listeners per key
 * plus in-memory app state for the current session.
 */
class Store {
  constructor() {
    this._state = {
      session: this._loadSession(),
      weddingsCache: null,
      engagementsCache: null,
    };
    this._listeners = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    this._state[key] = value;
    (this._listeners.get(key) || []).forEach((fn) => fn(value));
  }

  subscribe(key, fn) {
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(fn);
    return () => {
      this._listeners.set(
        key,
        this._listeners.get(key).filter((f) => f !== fn)
      );
    };
  }

  _loadSession() {
    try {
      const raw = localStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Purely a UX hint (avoids a flash of "logged in" UI) — the Apps Script
      // backend independently re-validates the token on every request.
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  saveSession(session) {
    localStorage.setItem(CONFIG.SESSION_STORAGE_KEY, JSON.stringify(session));
    this.set("session", session);
  }

  clearSession() {
    localStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
    this.set("session", null);
  }

  isAuthenticated() {
    const s = this.get("session");
    return !!(s && s.token && (!s.expiresAt || Date.now() < s.expiresAt));
  }
}

export const store = new Store();
