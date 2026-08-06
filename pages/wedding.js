import { api } from "../js/api.js";
import { createEl, formatDate, escapeHTML } from "../js/utils.js";
import { renderLoader, renderStatePanel } from "../components/loader.js";
import { renderStoryBody } from "../components/gallery.js";
import { renderContactActions } from "../components/contact-actions.js";
import { initScrollReveal } from "../js/animations.js";
import { setMeta, resetMeta } from "../js/seo.js";

export async function render(container, { slug }) {
  container.appendChild(renderLoader("Loading story"));

  let wedding;
  try {
    wedding = await api.getWeddingBySlug(slug);
  } catch {
    wedding = null;
  }

  container.innerHTML = "";

  if (!wedding) {
    container.appendChild(
      renderStatePanel({
        title: "This story could not be found.",
        body: "It may have been unpublished or the link may be incorrect.",
        actionLabel: "Back to Stories",
        actionHref: "/weddings",
      })
    );
    return;
  }

  return renderWeddingContent(container, wedding);
}

/**
 * Builds the full story view (header + chronological sections + CTA) from
 * an already-fetched wedding object. Shared by the public route above and
 * by /admin/preview.html, which fetches unpublished drafts through the
 * authenticated admin endpoint instead of the public one.
 */
export function renderWeddingContent(container, wedding) {
  setMeta({
    title: `${wedding.coupleName} — ${wedding.eventType === "wedding" ? "Wedding" : wedding.eventType === "engagement" ? "Engagement" : "Portrait"} Story`,
    description: wedding.description || `A ${wedding.eventType} story by Ahmed Mahmoud Photography.`,
    image: wedding.coverImage,
    type: "article",
  });

  container.appendChild(buildHeader(wedding));

  const sections = wedding.sections || [];
  if (sections.length) {
    const { fragment, mountRail } = renderStoryBody(sections);
    container.appendChild(fragment);
    document.body.appendChild(mountRail());
    container.dataset.hasRail = "true";
  } else {
    container.appendChild(
      renderStatePanel({ title: "Photos coming soon.", body: "This story's gallery is still being prepared." })
    );
  }

  container.appendChild(buildFooterCTA());
  initScrollReveal(container);

  // cleanup: remove the fixed rail (it's appended to body, outside the SPA outlet)
  return () => {
    document.querySelectorAll(".story-rail").forEach((el) => el.remove());
    resetMeta();
  };
}

function buildHeader(wedding) {
  const header = createEl("header", { class: "hero", style: "height:80dvh;" });
  const img = document.createElement("img");
  img.className = "hero__media";
  img.src = wedding.coverImage;
  img.alt = `${wedding.coupleName} — cover photograph`;
  img.setAttribute("fetchpriority", "high");
  img.decoding = "async";
  img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
  header.appendChild(img);
  header.appendChild(createEl("div", { class: "hero__scrim" }));
  header.appendChild(
    createEl("div", { class: "hero__content" }, [
      createEl("p", { class: "type-label hero__eyebrow" }, [
        escapeHTML(wedding.location || ""),
        wedding.location ? " \u00B7 " : "",
        formatDate(wedding.date),
      ]),
      createEl("h1", { class: "hero__title", style: "text-transform:none;" }, escapeHTML(wedding.coupleName)),
      wedding.description ? createEl("p", { class: "hero__statement" }, escapeHTML(wedding.description)) : null,
    ])
  );
  return header;
}

function buildFooterCTA() {
  const wrap = createEl("section", { class: "section text-center", style: "border-top:1px solid var(--color-border);" });
  const inner = createEl("div", { class: "container", "data-reveal": "" }, [
    createEl("h2", { class: "type-display-m" }, "Planning your own story?"),
  ]);
  const actions = renderContactActions();
  actions.style.justifyContent = "center";
  actions.style.marginTop = "24px";
  inner.appendChild(actions);
  wrap.appendChild(inner);
  return wrap;
}
