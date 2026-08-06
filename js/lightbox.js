/**
 * App-level lightbox controller. Ensures a single <image-lightbox> custom
 * element exists in the document and exposes a simple open(photos, index)
 * API to any page/component. The element itself (behavior + markup) lives
 * in /components/lightbox.js.
 */
let el = null;

function ensureElement() {
  if (el) return el;
  el = document.querySelector("image-lightbox");
  if (!el) {
    el = document.createElement("image-lightbox");
    document.body.appendChild(el);
  }
  return el;
}

export function openLightbox(photos, startIndex = 0) {
  const node = ensureElement();
  node.open(photos, startIndex);
}
