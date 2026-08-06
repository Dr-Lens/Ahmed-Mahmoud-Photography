import { createEl } from "../js/utils.js";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * The Story Rail — a fixed vertical timeline tied to scroll position.
 * Only used on wedding-story pages, where sections genuinely represent the
 * chronological arc of a wedding day (Preparation -> ... -> Details), so a
 * numbered, progress-filled rail encodes real information rather than
 * decorating the page.
 */
export function renderStoryRail(sections) {
  const rail = createEl("nav", { class: "story-rail", "aria-label": "Wedding day sections" });
  const track = createEl("div", { class: "story-rail__track" });
  const fill = createEl("div", { class: "story-rail__fill" });
  track.appendChild(fill);

  const nodeEls = sections.map((section, i) => {
    const node = createEl("a", { class: "story-rail__node", href: `#${section.id}` }, [
      createEl("span", { class: "numeral" }, ROMAN[i] || String(i + 1)),
      createEl("span", { class: "story-rail__label" }, section.title),
    ]);
    track.appendChild(node);
    return node;
  });

  rail.appendChild(track);

  const sectionEls = sections
    .map((s) => document.getElementById(s.id))
    .filter(Boolean);

  if (!sectionEls.length) return rail;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const idx = sectionEls.indexOf(entry.target);
        if (idx === -1) return;
        if (entry.isIntersecting) {
          nodeEls.forEach((n) => n.classList.remove("is-active"));
          nodeEls[idx].classList.add("is-active");
          const pct = sections.length > 1 ? (idx / (sections.length - 1)) * 100 : 100;
          fill.style.height = `${pct}%`;
        }
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );
  sectionEls.forEach((el) => observer.observe(el));

  return rail;
}
