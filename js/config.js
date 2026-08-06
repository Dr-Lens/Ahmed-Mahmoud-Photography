/**
 * Public runtime configuration.
 *
 * IMPORTANT — SECURITY:
 * Only the Apps Script Web App URL lives here. It is a public endpoint by
 * design (that's how a Web App works) and is safe to ship in frontend code.
 *
 * The Spreadsheet ID, the ImgBB API key, and the session secret are NEVER
 * referenced from this file or any other frontend file. They live exclusively
 * in the Apps Script project's Script Properties — see /apps-script/Config.gs
 * and the README "Script Properties" section for setup.
 */
export const CONFIG = Object.freeze({
  API_BASE_URL:
    "https://script.google.com/macros/s/AKfycbwI2QAGGaZNuKpyywuyWVrxg0dGW-5yV0_6xp4Fznb4Kz7uqiL96aouupWN-sq60-xt/exec",

  BRAND: {
    name: "Ahmed Mahmoud",
    fullName: "Ahmed Mahmoud Photography",
    phoneLocal: "01111714320",
    phoneIntl: "+201111714320",
    telHref: "tel:+201111714320",
    whatsappHref: "https://wa.me/201111714320",
  },

  // Session token lifetime hint used only for client-side UX (e.g. showing a
  // "your session has expired" state). The Apps Script backend is the single
  // source of truth for whether a token is actually still valid.
  SESSION_STORAGE_KEY: "amp_admin_session",

  // Runtime caching limits for the service worker image cache.
  SW_IMAGE_CACHE_MAX_ENTRIES: 120,
});
