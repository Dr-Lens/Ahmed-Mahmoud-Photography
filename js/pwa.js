import { qs, createEl } from "./utils.js";

const DISMISS_KEY = "amp_install_dismissed";

export function initInstallPrompt() {
  if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showBanner({
      message: "Install Ahmed Mahmoud Photography for quick access to stories.",
      actionLabel: "Install",
      onAction: async () => {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        hideBanner();
      },
    });
  });

  if (isIOS() && !isStandalone()) {
    // Unobtrusive, shown once per session-ish (respects dismissal).
    setTimeout(() => {
      showBanner({
        message: "Add to Home Screen: tap Share, then \u201CAdd to Home Screen.\u201D",
        actionLabel: "Got it",
        onAction: hideBanner,
      });
    }, 4000);
  }
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function showBanner({ message, actionLabel, onAction }) {
  if (qs("#install-banner-dynamic")) return;
  const banner = createEl("div", { class: "install-banner", id: "install-banner-dynamic" }, [
    createEl("p", {}, message),
    createEl("div", { style: "display:flex; gap:8px; flex-shrink:0;" }, [
      createEl("button", { class: "btn btn--sm btn--primary", onClick: onAction }, actionLabel),
      createEl("button", { class: "btn btn--sm btn--ghost", onClick: dismiss }, "Dismiss"),
    ]),
  ]);
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add("is-visible"));
}

function hideBanner() {
  const banner = qs("#install-banner-dynamic");
  if (!banner) return;
  banner.classList.remove("is-visible");
  setTimeout(() => banner.remove(), 400);
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, "1");
  hideBanner();
}
