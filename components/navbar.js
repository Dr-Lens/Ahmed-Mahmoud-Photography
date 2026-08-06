import { CONFIG } from "../js/config.js";

const NAV_LINKS = [
  { href: "/weddings", label: "Weddings" },
  { href: "/engagements", label: "Engagements" },
  { href: "/portraits", label: "Portraits" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

class SiteNavbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav class="site-nav" id="site-nav">
        <div class="site-nav__inner">
          <a href="/" class="site-nav__logo" data-link aria-label="${CONFIG.BRAND.fullName} — Home">
            <img src="/assets/brand/logo.png" alt="${CONFIG.BRAND.fullName}" width="160" height="40" />
          </a>
          <div class="site-nav__links desktop-only" role="navigation" aria-label="Primary">
            ${NAV_LINKS.map((l) => `<a href="${l.href}" data-link>${l.label}</a>`).join("")}
          </div>
          <div class="site-nav__actions">
            <a class="btn btn--ghost btn--sm desktop-only" href="${CONFIG.BRAND.whatsappHref}" target="_blank" rel="noopener">WhatsApp</a>
            <button class="site-nav__burger mobile-only" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>
      <div class="mobile-menu" id="mobile-menu">
        <nav class="mobile-menu__links" aria-label="Mobile">
          ${NAV_LINKS.map((l) => `<a href="${l.href}" data-link>${l.label}</a>`).join("")}
        </nav>
        <div class="mobile-menu__foot contact-actions">
          <a class="btn btn--primary btn--block" href="${CONFIG.BRAND.telHref}">Call Ahmed</a>
          <a class="btn btn--whatsapp btn--block" href="${CONFIG.BRAND.whatsappHref}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    `;

    this._burger = this.querySelector(".site-nav__burger");
    this._menu = this.querySelector("#mobile-menu");
    this._nav = this.querySelector("#site-nav");

    this._burger.addEventListener("click", () => this._toggleMenu());
    this.querySelectorAll(".mobile-menu__links a").forEach((a) =>
      a.addEventListener("click", () => this._closeMenu())
    );

    this._onScroll = () => {
      this._nav.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll();

    this.markActive();
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._onScroll);
  }

  _toggleMenu() {
    const open = !this._menu.classList.contains("is-open");
    this._menu.classList.toggle("is-open", open);
    this._burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }

  _closeMenu() {
    this._menu.classList.remove("is-open");
    this._burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  markActive() {
    const path = location.pathname === "/" ? "/" : location.pathname.replace(/\/$/, "");
    this.querySelectorAll("a[data-link]").forEach((a) => {
      const href = a.getAttribute("href");
      const isHome = href === "/" && path === "/";
      const isMatch = href !== "/" && path.startsWith(href);
      if (isHome || isMatch) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
}

customElements.define("site-navbar", SiteNavbar);
