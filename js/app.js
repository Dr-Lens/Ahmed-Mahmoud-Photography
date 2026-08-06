import "../components/navbar.js";
import "../components/footer.js";
import "../components/lightbox.js";
import { Router } from "./router.js";
import { qs } from "./utils.js";
import { initInstallPrompt } from "./pwa.js";

const routes = [
  { pattern: "/", load: () => import("../pages/home.js") },
  { pattern: "/weddings", load: () => import("../pages/weddings.js") },
  { pattern: "/weddings/:slug", load: () => import("../pages/wedding.js") },
  { pattern: "/engagements", load: () => import("../pages/engagements.js") },
  { pattern: "/engagements/:slug", load: () => import("../pages/wedding.js") },
  { pattern: "/portraits", load: () => import("../pages/portraits.js") },
  { pattern: "/portraits/:slug", load: () => import("../pages/wedding.js") },
  { pattern: "/about", load: () => import("../pages/about.js") },
  { pattern: "/contact", load: () => import("../pages/contact.js") },
];

async function notFound(outlet) {
  const { renderStatePanel } = await import("../components/loader.js");
  outlet.appendChild(
    renderStatePanel({
      title: "This story could not be found.",
      body: "The page you're looking for doesn't exist or may have moved.",
      actionLabel: "Back to Stories",
      actionHref: "/weddings",
    })
  );
}

function boot() {
  const outlet = qs("#app");
  const veil = qs("#route-veil");
  const router = new Router({ outlet, veil, routes, notFound });
  router.start();
  initInstallPrompt();
  registerServiceWorker();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
  });
}

boot();
