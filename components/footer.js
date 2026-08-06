import { CONFIG } from "../js/config.js";

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="site-footer__top">
            <div class="site-footer__brand">
              <img src="/assets/brand/logo.png" alt="${CONFIG.BRAND.fullName}" width="150" height="38" loading="lazy" />
              <p class="type-caption" style="max-width: 32ch;">Stories captured beautifully.</p>
            </div>
            <div class="site-footer__col">
              <h4 class="type-label">Explore</h4>
              <a href="/weddings" data-link>Weddings</a>
              <a href="/engagements" data-link>Engagements</a>
              <a href="/portraits" data-link>Portraits</a>
              <a href="/about" data-link>About</a>
            </div>
            <div class="site-footer__col">
              <h4 class="type-label">Get in touch</h4>
              <a href="${CONFIG.BRAND.telHref}">${CONFIG.BRAND.phoneLocal}</a>
              <a href="${CONFIG.BRAND.whatsappHref}" target="_blank" rel="noopener">WhatsApp</a>
              <a href="/contact" data-link>Contact page</a>
            </div>
          </div>
          <div class="site-footer__bottom">
            <span>&copy; ${year} ${CONFIG.BRAND.fullName}. All rights reserved.</span>
            <span>Built with an editorial eye.</span>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define("site-footer", SiteFooter);
