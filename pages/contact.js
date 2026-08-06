import { createEl, escapeHTML } from "../js/utils.js";
import { renderContactActions } from "../components/contact-actions.js";
import { CONFIG } from "../js/config.js";
import { initScrollReveal } from "../js/animations.js";
import { setMeta, resetMeta } from "../js/seo.js";

export function render(container) {
  setMeta({ title: "Contact Ahmed Mahmoud — Ahmed Mahmoud Photography" });

  container.appendChild(
    createEl("section", { class: "section text-center", style: "padding-top: calc(var(--nav-height) + 64px);" }, [
      createEl("div", { class: "container-narrow", "data-reveal": "" }, [
        createEl("h1", { class: "type-display-xl text-balance" }, [
          "Let's create",
          document.createElement("br"),
          createEl("span", { class: "serif-italic text-accent" }, "something"),
          document.createElement("br"),
          "timeless.",
        ]),
        createEl("p", { class: "lead", style: "margin: 24px auto 0;" }, escapeHTML(CONFIG.BRAND.fullName)),
        createEl("p", { style: "margin: 4px auto 0; max-width:none;" }, escapeHTML(CONFIG.BRAND.phoneLocal)),
        (() => {
          const actions = renderContactActions();
          actions.style.justifyContent = "center";
          actions.style.marginTop = "32px";
          return actions;
        })(),
      ]),
    ])
  );

  initScrollReveal(container);
  return () => resetMeta();
}
