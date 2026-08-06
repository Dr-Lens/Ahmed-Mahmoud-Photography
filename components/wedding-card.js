import { createEl, formatDate, escapeHTML } from "../js/utils.js";

/**
 * Renders a single story card. `basePath` selects /weddings/:slug vs
 * /engagements/:slug so the same component serves both listing pages.
 */
export function renderWeddingCard(wedding, { featured = false, basePath = "/weddings" } = {}) {
  const a = createEl("a", {
    class: `story-card${featured ? " story-card--featured" : ""}`,
    href: `${basePath}/${wedding.slug}`,
    "data-link": "",
  });

  const frame = createEl("div", { class: "story-card__frame" });
  const img = document.createElement("img");
  img.src = wedding.coverImage;
  img.alt = `${wedding.coupleName} — ${wedding.eventType}`;
  img.loading = "lazy";
  img.decoding = "async";
  img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
  frame.appendChild(img);

  const meta = createEl("div", { class: "story-card__meta" }, [
    createEl("div", { class: "story-card__names" }, escapeHTML(wedding.coupleName)),
    createEl(
      "div",
      { class: "story-card__sub" },
      `${escapeHTML(wedding.location || "")}${wedding.location ? " · " : ""}${formatDate(wedding.date)}`
    ),
  ]);

  frame.appendChild(meta);
  a.appendChild(frame);
  return a;
}
