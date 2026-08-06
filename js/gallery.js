import { createEl, escapeHTML } from "./utils.js";

/**
 * Repeating editorial pattern of frame sizes. Not a uniform grid: large
 * feature frames punctuate pairs/trios of supporting images, the way a
 * print magazine spreads a story across a page.
 */
const PATTERN = ["wide", "third", "half", "half", "full", "tall", "small", "small", "third"];

let lazyObserver = null;
function getLazyObserver() {
  if (lazyObserver) return lazyObserver;
  lazyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
        lazyObserver.unobserve(img);
      });
    },
    { rootMargin: "400px 0px" }
  );
  return lazyObserver;
}

/**
 * Builds a `.gallery` grid element from a list of photos.
 * @param {Array<{imageUrl:string, thumbnailUrl?:string, caption?:string}>} photos
 * @param {{onOpen:(index:number)=>void, priorityFirst?:boolean}} opts
 */
export function renderGallery(photos, { onOpen, priorityFirst = false } = {}) {
  const grid = createEl("div", { class: "gallery", role: "list" });

  photos.forEach((photo, i) => {
    const size = PATTERN[i % PATTERN.length];
    const item = createEl("figure", {
      class: `gallery__item gallery__item--${size}`,
      role: "listitem",
    });

    const img = document.createElement("img");
    img.alt = photo.caption || "";
    img.loading = i === 0 && priorityFirst ? "eager" : "lazy";
    img.decoding = "async";
    if (i === 0 && priorityFirst) {
      img.setAttribute("fetchpriority", "high");
      img.src = photo.thumbnailUrl || photo.imageUrl;
    } else {
      // Lazy: defer real src until near viewport.
      img.dataset.src = photo.thumbnailUrl || photo.imageUrl;
      img.src =
        "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3E%3Crect width='4' height='5' fill='%23151412'/%3E%3C/svg%3E";
    }
    img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
    img.addEventListener("click", () => onOpen && onOpen(i));

    item.appendChild(img);
    if (photo.caption) {
      const cap = createEl("figcaption", { class: "gallery__caption" }, escapeHTML(photo.caption));
      item.appendChild(cap);
    }
    grid.appendChild(item);

    if (!(i === 0 && priorityFirst)) getLazyObserver().observe(img);
  });

  return grid;
}
