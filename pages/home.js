import { api } from "../js/api.js";
import { createEl, escapeHTML } from "../js/utils.js";
import { renderWeddingCard } from "../components/wedding-card.js";
import { renderContactActions } from "../components/contact-actions.js";
import { renderLoader, renderStatePanel } from "../components/loader.js";
import { initScrollReveal, initParallax } from "../js/animations.js";
import { CONFIG } from "../js/config.js";

export async function render(container) {
  container.appendChild(buildHero());
  const sections = createEl("div", {});
  container.appendChild(sections);
  sections.appendChild(renderLoader());

  let weddings = [];
  try {
    weddings = await api.getPublishedWeddings();
  } catch {
    sections.innerHTML = "";
    sections.appendChild(
      renderStatePanel({
        title: "Stories are coming soon.",
        body: "We couldn't load recent work right now — please check back shortly.",
      })
    );
    initScrollReveal(container);
    return;
  }

  sections.innerHTML = "";
  sections.append(
    buildFeatured(weddings),
    buildCategories(),
    buildIntro(),
    buildSelectedWork(weddings),
    buildCTA()
  );

  initScrollReveal(container);
  const media = container.querySelector(".hero__media");
  initParallax(media, 0.1);
}

function buildHero() {
  const hero = createEl("section", { class: "hero" });
  const img = document.createElement("img");
  img.className = "hero__media";
  img.src = "/assets/images/hero-placeholder.jpg";
  img.alt = "A candid wedding moment photographed by Ahmed Mahmoud";
  img.setAttribute("fetchpriority", "high");
  img.decoding = "async";
  img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
  hero.appendChild(img);
  hero.appendChild(createEl("div", { class: "hero__scrim" }));

  hero.appendChild(
    createEl("div", { class: "hero__content" }, [
      createEl("p", { class: "type-label hero__eyebrow" }, "Wedding & Editorial Photography"),
      createEl("h1", { class: "hero__title" }, "Ahmed Mahmoud\u00A0Photography"),
      createEl("p", { class: "hero__statement" }, "Stories captured beautifully."),
      createEl("div", { class: "hero__actions" }, [
        createEl("a", { class: "btn btn--primary", href: "/weddings", "data-link": "" }, "Explore Weddings"),
        createEl("a", { class: "btn btn--ghost", href: "/contact", "data-link": "" }, "Contact Ahmed"),
      ]),
    ])
  );

  hero.appendChild(
    createEl("div", { class: "hero__scroll-cue", "aria-hidden": "true" }, [
      createEl("span", { class: "line" }),
      createEl("span", { class: "type-label" }, "Scroll"),
    ])
  );

  return hero;
}

function buildFeatured(weddings) {
  const featured = weddings.find((w) => w.featured) || weddings[0];
  const wrap = createEl("section", { class: "section" });
  const inner = createEl("div", { class: "container" });
  inner.appendChild(
    createEl("div", { class: "section-head", "data-reveal": "" }, [
      createEl("p", { class: "type-label" }, "Featured Story"),
      createEl("h2", { class: "type-display-l" }, "A Recent Wedding"),
    ])
  );
  if (featured) {
    const card = createEl("div", { "data-reveal": "" });
    card.appendChild(renderWeddingCard(featured, { featured: true }));
    inner.appendChild(card);
  } else {
    inner.appendChild(
      renderStatePanel({
        title: "Stories are coming soon.",
        body: "Ahmed's latest wedding stories will appear here shortly.",
      })
    );
  }
  wrap.appendChild(inner);
  return wrap;
}

function buildCategories() {
  const cats = [
    { label: "Weddings", href: "/weddings", desc: "Full wedding-day storytelling." },
    { label: "Engagements", href: "/engagements", desc: "Intimate pre-wedding sessions." },
    { label: "Portraits", href: "/portraits", desc: "Editorial portrait sittings." },
  ];
  const wrap = createEl("section", { class: "section section-tight", style: "border-top:1px solid var(--color-border); border-bottom:1px solid var(--color-border);" });
  const inner = createEl("div", { class: "container grid-3", "data-reveal-group": "" });
  cats.forEach((c) => {
    inner.appendChild(
      createEl("a", { class: "story-card", href: c.href, "data-link": "" }, [
        createEl("h3", { class: "type-display-s" }, c.label),
        createEl("p", {}, c.desc),
      ])
    );
  });
  wrap.appendChild(inner);
  return wrap;
}

function buildIntro() {
  const wrap = createEl("section", { class: "section" });
  const inner = createEl("div", { class: "container-narrow text-center", "data-reveal": "" }, [
    createEl("p", { class: "type-label" }, "The Photographer"),
    createEl(
      "p",
      { class: "type-display-s serif-italic", style: "margin-top:16px;" },
      "Ahmed Mahmoud photographs weddings as they unfold — quietly, honestly, and with an eye for the moments people don't pose for."
    ),
    createEl("a", { class: "btn btn--ghost", href: "/about", "data-link": "", style: "margin-top:32px;" }, "About Ahmed"),
  ]);
  wrap.appendChild(inner);
  return wrap;
}

function buildSelectedWork(weddings) {
  const wrap = createEl("section", { class: "section" });
  const inner = createEl("div", { class: "container" });
  inner.appendChild(
    createEl("div", { class: "section-head section-head--row", "data-reveal": "" }, [
      createEl("h2", { class: "type-display-l" }, "Selected Work"),
      createEl("a", { class: "type-label", href: "/weddings", "data-link": "" }, "View all \u2192"),
    ])
  );
  const grid = createEl("div", { class: "grid-3", "data-reveal-group": "" });
  const list = weddings.slice(0, 6);
  if (!list.length) {
    inner.appendChild(
      renderStatePanel({ title: "Stories are coming soon.", body: "New wedding stories are on the way." })
    );
  } else {
    list.forEach((w) => grid.appendChild(renderWeddingCard(w)));
    inner.appendChild(grid);
  }
  wrap.appendChild(inner);
  return wrap;
}

function buildCTA() {
  const wrap = createEl("section", { class: "section", style: "border-top:1px solid var(--color-border);" });
  const inner = createEl("div", { class: "container text-center", "data-reveal": "" }, [
    createEl("h2", { class: "type-display-l text-balance" }, [
      "Let's create",
      document.createElement("br"),
      createEl("span", { class: "serif-italic text-accent" }, "something timeless."),
    ]),
    createEl("p", { class: "lead", style: "margin:20px auto 0;" }, `${escapeHTML(CONFIG.BRAND.fullName)} \u00B7 ${escapeHTML(CONFIG.BRAND.phoneLocal)}`),
  ]);
  const actions = renderContactActions();
  actions.style.justifyContent = "center";
  actions.style.marginTop = "32px";
  inner.appendChild(actions);
  wrap.appendChild(inner);
  return wrap;
}
