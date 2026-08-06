import { prefersReducedMotion, qsa } from "./utils.js";

let observer = null;

function getObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
  );
  return observer;
}

/** Observes every [data-reveal] element under root and reveals it on scroll into view. */
export function initScrollReveal(root = document) {
  if (prefersReducedMotion()) {
    qsa("[data-reveal]", root).forEach((el) => el.classList.add("is-revealed"));
    return;
  }
  const obs = getObserver();
  qsa("[data-reveal-group]", root).forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.setProperty("--reveal-index", i);
      if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "");
    });
  });
  qsa("[data-reveal]", root).forEach((el) => obs.observe(el));
}

/** Lightweight parallax for hero media — respects reduced motion. */
export function initParallax(el, strength = 0.12) {
  if (!el || prefersReducedMotion()) return;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      el.style.transform = `translate3d(0, ${Math.min(y * strength, 120)}px, 0)`;
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

/** Fades the route veil in, runs `swap`, then fades it out. */
export async function withRouteTransition(veilEl, swap) {
  if (prefersReducedMotion()) {
    await swap();
    return;
  }
  veilEl.classList.add("is-active");
  await new Promise((r) => setTimeout(r, 180));
  await swap();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  await new Promise((r) => setTimeout(r, 40));
  veilEl.classList.remove("is-active");
}
