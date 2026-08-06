import { createEl } from "../js/utils.js";

export function renderLoader(label = "Loading") {
  return createEl("div", { class: "loader", role: "status", "aria-live": "polite" }, [
    createEl("span", { class: "loader__mark" }),
    createEl("span", { class: "sr-only", style: "position:absolute;left:-9999px;" }, label),
  ]);
}

export function renderStatePanel({ title, body, actionLabel, actionHref }) {
  const panel = createEl("div", { class: "state-panel" }, [
    createEl("h2", { class: "type-display-s" }, title),
    body ? createEl("p", { class: "text-center" }, body) : null,
  ]);
  if (actionLabel && actionHref) {
    panel.appendChild(
      createEl("a", { class: "btn btn--primary", href: actionHref, "data-link": "" }, actionLabel)
    );
  }
  return panel;
}
