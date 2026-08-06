import { createEl } from "../js/utils.js";
import { renderContactActions } from "../components/contact-actions.js";
import { initScrollReveal } from "../js/animations.js";
import { setMeta, resetMeta } from "../js/seo.js";

export function render(container) {
  setMeta({ title: "About Ahmed Mahmoud — Ahmed Mahmoud Photography" });

  container.appendChild(
    createEl("header", { class: "section container-narrow", style: "padding-top: calc(var(--nav-height) + 32px);" }, [
      createEl("p", { class: "type-label" }, "About"),
      createEl("h1", { class: "type-display-l" }, "Ahmed Mahmoud"),
    ])
  );

  container.appendChild(
    createEl("section", { class: "section-tight container-narrow", "data-reveal": "" }, [
      createEl(
        "p",
        { class: "lead" },
        "Ahmed Mahmoud is a wedding and editorial photographer working under the name Ahmed Mahmoud Photography."
      ),
      createEl(
        "p",
        {},
        "His approach centers on storytelling and emotion — documenting the unscripted moments of a wedding day rather than staging them, so that the photographs feel timeless rather than performed."
      ),
      createEl(
        "p",
        { style: "color: var(--color-muted); font-style: italic;" },
        "[Additional biography, career milestones, and background to be added by the photographer.]"
      ),
    ])
  );

  container.appendChild(
    createEl("section", { class: "section container-narrow", style: "border-top:1px solid var(--color-border);", "data-reveal": "" }, [
      createEl("h2", { class: "type-display-s" }, "Get in touch"),
      createEl("p", {}, "For availability and story enquiries, reach out directly."),
      (() => {
        const actions = renderContactActions();
        actions.style.marginTop = "20px";
        return actions;
      })(),
    ])
  );

  initScrollReveal(container);
  return () => resetMeta();
}
