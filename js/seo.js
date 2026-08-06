const DEFAULTS = {
  title: "Ahmed Mahmoud Photography — Wedding & Editorial Photography",
  description:
    "Ahmed Mahmoud Photography — cinematic, editorial wedding and engagement storytelling.",
  image: "/assets/brand/logo.png",
  type: "website",
};

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setMeta({ title, description, image, type } = {}) {
  const t = title || DEFAULTS.title;
  const d = description || DEFAULTS.description;
  const i = image || DEFAULTS.image;

  document.title = t;
  upsertMeta("name", "description", d);
  upsertMeta("property", "og:title", t);
  upsertMeta("property", "og:description", d);
  upsertMeta("property", "og:image", i);
  upsertMeta("property", "og:type", type || DEFAULTS.type);
  upsertMeta("property", "og:url", location.href);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", t);
  upsertMeta("name", "twitter:description", d);
  upsertMeta("name", "twitter:image", i);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", location.href.split("?")[0]);
}

export function resetMeta() {
  setMeta(DEFAULTS);
}
