import { api } from "../js/api.js";
import { createEl } from "../js/utils.js";
import { renderWeddingCard } from "../components/wedding-card.js";
import { renderLoader, renderStatePanel } from "../components/loader.js";
import { initScrollReveal } from "../js/animations.js";

export async function renderListing(container, { eventType, title, eyebrow, emptyBody }) {
  const header = createEl("header", { class: "section-tight container", style: `padding-top: calc(var(--nav-height) + 32px);` }, [
    createEl("p", { class: "type-label" }, eyebrow),
    createEl("h1", { class: "type-display-l" }, title),
  ]);
  container.appendChild(header);

  const body = createEl("div", { class: "container section-tight" });
  container.appendChild(body);
  body.appendChild(renderLoader());

  let items = [];
  try {
    items = await api.getPublishedWeddings(eventType);
  } catch {
    body.innerHTML = "";
    body.appendChild(
      renderStatePanel({ title: "Something went wrong.", body: "Please try again in a moment." })
    );
    return;
  }

  body.innerHTML = "";
  if (!items.length) {
    body.appendChild(renderStatePanel({ title: "Stories are coming soon.", body: emptyBody }));
    initScrollReveal(container);
    return;
  }

  const grid = createEl("div", { class: "grid-3", "data-reveal-group": "" });
  items.forEach((item) => grid.appendChild(renderWeddingCard(item, { basePath: `/${eventType}s` })));
  body.appendChild(grid);
  initScrollReveal(container);
}
