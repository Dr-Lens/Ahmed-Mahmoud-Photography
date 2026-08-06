import { qs, qsa } from "./utils.js";
import { withRouteTransition } from "./animations.js";

/**
 * Minimal History-API router. Routes are registered as
 *   { pattern: "/weddings/:slug", load: () => import(...) }
 * `load()` must resolve to a module exposing `render(container, params)`
 * and optionally `render()` may return a cleanup function.
 */
export class Router {
  constructor({ outlet, veil, routes, notFound }) {
    this.outlet = outlet;
    this.veil = veil;
    this.routes = routes;
    this.notFound = notFound;
    this._cleanup = null;

    document.addEventListener("click", (e) => this._onLinkClick(e));
    window.addEventListener("popstate", () => this._navigate(location.pathname, { push: false }));
  }

  start() {
    // GitHub Pages SPA fallback: 404.html redirects to /?p=/original/path
    const params = new URLSearchParams(location.search);
    const redirected = params.get("p");
    if (redirected) {
      const clean = decodeURIComponent(redirected);
      history.replaceState({}, "", clean);
      this._navigate(clean, { push: false });
    } else {
      this._navigate(location.pathname, { push: false });
    }
  }

  navigate(path) {
    this._navigate(path, { push: true });
  }

  _onLinkClick(e) {
    const link = e.target.closest("a[data-link]");
    if (!link) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let new-tab etc behave normally
    const url = new URL(link.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    this.navigate(url.pathname + url.search);
  }

  _match(path) {
    for (const route of this.routes) {
      const paramNames = [];
      const regexStr =
        "^" +
        route.pattern
          .replace(/\/:[^/]+/g, (m) => {
            paramNames.push(m.slice(2));
            return "/([^/]+)";
          })
          .replace(/\//g, "\\/") +
        "\\/?$";
      const match = path.match(new RegExp(regexStr));
      if (match) {
        const params = {};
        paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
        return { route, params };
      }
    }
    return null;
  }

  async _navigate(path, { push }) {
    const cleanPath = path.split("?")[0].replace(/\/$/, "") || "/";
    if (push) history.pushState({}, "", cleanPath);

    this._closeMobileMenu();

    const matched = this._match(cleanPath);
    await withRouteTransition(this.veil, async () => {
      if (this._cleanup) {
        try {
          this._cleanup();
        } catch {
          /* noop */
        }
        this._cleanup = null;
      }
      this.outlet.innerHTML = "";

      if (!matched) {
        if (this.notFound) await this.notFound(this.outlet);
        return;
      }
      try {
        const mod = await matched.route.load();
        const result = await mod.render(this.outlet, matched.params);
        if (typeof result === "function") this._cleanup = result;
      } catch (err) {
        console.error("Route render failed:", err);
        if (this.notFound) await this.notFound(this.outlet);
      }
    });

    document.title = this._titleFor(cleanPath);
    qsa("site-navbar").forEach((nav) => nav.markActive && nav.markActive());
  }

  _closeMobileMenu() {
    const menu = qs("#mobile-menu");
    const burger = qs(".site-nav__burger");
    if (menu?.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      burger?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  }

  _titleFor(path) {
    const base = "Ahmed Mahmoud Photography";
    if (path === "/") return `${base} — Wedding & Editorial Photography`;
    const label = path.split("/").filter(Boolean).join(" — ").replace(/-/g, " ");
    return `${label.replace(/\b\w/g, (c) => c.toUpperCase())} — ${base}`;
  }
}
