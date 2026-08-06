/**
 * <image-lightbox> — fullscreen editorial image viewer.
 * Keyboard: Escape closes, ArrowLeft/ArrowRight navigate.
 * Touch: horizontal swipe navigates.
 */
class ImageLightbox extends HTMLElement {
  constructor() {
    super();
    this.photos = [];
    this.index = 0;
    this._touchStartX = null;
    this._lastFocused = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="lightbox">
        <div class="lightbox__scrim" data-close></div>
        <div class="lightbox__stage">
          <figure class="lightbox__figure">
            <img alt="" />
            <figcaption class="lightbox__caption"></figcaption>
          </figure>
          <button class="lightbox__close" aria-label="Close">&#10005;</button>
          <button class="lightbox__prev" aria-label="Previous photo">&#8592;</button>
          <button class="lightbox__next" aria-label="Next photo">&#8594;</button>
          <div class="lightbox__counter"></div>
        </div>
      </div>
    `;
    this.$root = this.querySelector(".lightbox");
    this.$img = this.querySelector("img");
    this.$caption = this.querySelector(".lightbox__caption");
    this.$counter = this.querySelector(".lightbox__counter");

    this.querySelector("[data-close]").addEventListener("click", () => this.close());
    this.querySelector(".lightbox__close").addEventListener("click", () => this.close());
    this.querySelector(".lightbox__prev").addEventListener("click", () => this.show(this.index - 1));
    this.querySelector(".lightbox__next").addEventListener("click", () => this.show(this.index + 1));

    this._onKeydown = (e) => {
      if (!this.classList.contains("is-open")) return;
      if (e.key === "Escape") this.close();
      if (e.key === "ArrowLeft") this.show(this.index - 1);
      if (e.key === "ArrowRight") this.show(this.index + 1);
      if (e.key === "Tab") this._trapFocus(e);
    };
    document.addEventListener("keydown", this._onKeydown);

    const stage = this.querySelector(".lightbox__stage");
    stage.addEventListener(
      "touchstart",
      (e) => {
        this._touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchend",
      (e) => {
        if (this._touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - this._touchStartX;
        if (Math.abs(dx) > 50) this.show(this.index + (dx < 0 ? 1 : -1));
        this._touchStartX = null;
      },
      { passive: true }
    );
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKeydown);
  }

  open(photos, startIndex = 0) {
    this.photos = photos || [];
    this._lastFocused = document.activeElement;
    this.classList.add("is-open");
    document.body.style.overflow = "hidden";
    this.show(startIndex);
    requestAnimationFrame(() => this.$root.classList.add("is-visible"));
    this.querySelector(".lightbox__close").focus();
  }

  close() {
    this.$root.classList.remove("is-visible");
    document.body.style.overflow = "";
    setTimeout(() => this.classList.remove("is-open"), 260);
    if (this._lastFocused) this._lastFocused.focus();
  }

  show(i) {
    if (!this.photos.length) return;
    this.index = (i + this.photos.length) % this.photos.length;
    const photo = this.photos[this.index];
    this.$img.src = photo.imageUrl;
    this.$img.alt = photo.caption || "";
    this.$caption.textContent = photo.caption || "";
    this.$counter.textContent = `${this.index + 1} / ${this.photos.length}`;
  }

  _trapFocus(e) {
    const focusable = this.querySelectorAll("button");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

customElements.define("image-lightbox", ImageLightbox);
