import { createEl } from "../js/utils.js";
import { CONFIG } from "../js/config.js";

/**
 * Renders elegant Call / WhatsApp buttons. Used in the hero, the contact
 * section, and as a compact mobile action bar.
 */
export function renderContactActions({ variant = "default" } = {}) {
  const wrap = createEl("div", { class: "contact-actions" });

  const call = createEl(
    "a",
    { class: "btn btn--primary", href: CONFIG.BRAND.telHref },
    [callIcon(), "Call Ahmed"]
  );
  const whatsapp = createEl(
    "a",
    { class: "btn btn--whatsapp", href: CONFIG.BRAND.whatsappHref, target: "_blank", rel: "noopener" },
    [whatsappIcon(), "WhatsApp"]
  );

  wrap.append(call, whatsapp);
  if (variant === "block") {
    call.classList.add("btn--block");
    whatsapp.classList.add("btn--block");
  }
  return wrap;
}

function callIcon() {
  const span = document.createElement("span");
  span.innerHTML =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5c0 8.284 6.716 15 15 15l3-3-5-4-2 2c-2.5-1-4.5-3-5.5-5.5l2-2-4-5-3 2.5z"/></svg>';
  return span.firstChild;
}
function whatsappIcon() {
  const span = document.createElement("span");
  span.innerHTML =
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.35a9.9 9.9 0 0 0 4.62 1.15h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.44 17.5 2 12.04 2zm5.8 14.14c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.13.11-1.83-.12-.42-.13-.96-.31-1.66-.6-2.92-1.26-4.83-4.2-4.98-4.4-.15-.19-1.2-1.59-1.2-3.04 0-1.45.76-2.16 1.03-2.46.27-.29.6-.36.8-.36l.57.01c.18.01.43-.07.67.51.24.6.83 2.05.9 2.2.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.08.17-.21.72-.83.91-1.12.19-.29.38-.24.63-.14.26.1 1.63.77 1.91.91.29.14.48.21.55.33.07.12.07.68-.17 1.36z"/></svg>';
  return span.firstChild;
}
