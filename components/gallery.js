import { createEl, escapeHTML } from "../js/utils.js";
import { renderGallery } from "../js/gallery.js";
import { openLightbox } from "../js/lightbox.js";
import { renderStoryRail } from "./story-rail.js";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * Renders the full chronological wedding-story body: one <section> per
 * narrative beat (Preparation, Ceremony, ...), each with its own editorial
 * gallery, plus the fixed Story Rail navigator wired to scroll position.
 */
export function renderStoryBody(sections) {
  const fragment = document.createDocumentFragment();
  const allPhotos = [];
  const offsets = [];

  sections.forEach((section) => {
    offsets.push(allPhotos.length);
    allPhotos.push(...(section.photos || []));
  });

  sections.forEach((section, i) => {
    const el = createEl("section", { class: "story-section container", id: section.id }, [
      createEl("div", { class: "story-section__head" }, [
        createEl("span", { class: "numeral story-section__index" }, ROMAN[i] || String(i + 1)),
        createEl("h2", { class: "story-section__title" }, escapeHTML(section.title)),
      ]),
    ]);
    if (section.description) {
      el.appendChild(createEl("p", { class: "story-section__desc" }, escapeHTML(section.description)));
    }
    const offset = offsets[i];
    const grid = renderGallery(section.photos || [], {
      onOpen: (localIndex) => openLightbox(allPhotos, offset + localIndex),
    });
    el.appendChild(grid);
    fragment.appendChild(el);
  });

  return { fragment, mountRail: () => renderStoryRail(sections) };
}
