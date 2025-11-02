import css from "./wc-pagination.css" with { type: "css" };

class WCPagination extends HTMLElement {
  static get observedAttributes() {
    return ["total", "page-size", "current"];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({
      mode: "open",
    });
    this.shadowRoot.adoptedStyleSheets.push(css);
  }

  get html() {
    return `
      <nav aria-label="Pagination">
        <ol>
          <li>
            <button type="button"
                    aria-label="${this.current === 1 ? "Already on page 1" : "Go to page 1"}"
                    title="${this.current === 1 ? "Already on page 1" : "Go to page 1"}"
                    ${this.current === 1 ? ["disabled", `aria-disabled="true"`].join(" ") : `data-target="1"`}>
              ←
            </button>
          </li>
          ${
            (this.totalPages > 3) && (this.current - 2 >= 1)
              ? `
            <li>
              <button type="button"
                      aria-label="${["Go to page", this.current - 3].join(" ")}"
                      data-target="${this.current - 3}"
                      title="${["Go to page", this.current - 3].join(" ")}">
                <span aria-hidden="true">…</span>
                <span class="sr-only">${["Jump back three pages, to page", this.current - 3].join(" ")}</span>
              </button>
            </li>
          `
              : ""
          }
          ${this.generatePages()
            .map(
              (page) => `
            <li>  
              <button type="button"
                      ${
                        page === this.current
                          ? 'aria-current="page" aria-disabled="true"'
                          : `data-target="${page}"`
                      }
                      aria-label="${
                        page === this.current
                          ? ["Current page, page", page].join(" ")
                          : ["Go to page", page].join(" ")
                      }"
                      title="${
                        page === this.current
                          ? ["Current page, page", page].join(" ")
                          : ["Go to page", page].join(" ")
                      }"
              >
                ${page}
              </button>
            </li>
          `,
            )
            .join("")}
          ${
            (this.totalPages > 3) && (this.current + 2 <= this.totalPages)
              ? `
            <li>
              <button type="button"
                      aria-label="${["Go to page", this.current + 3].join(" ")}"
                      data-target="${this.current + 3}"
                      title="${["Go to page", this.current + 3].join(" ")}">
              <span aria-hidden="true">…</span>
              <span class="sr-only">${["Jump forward three pages, to page", this.current + 3].join(" ")}</span>
              </button>
            </li>
          `
              : ""
          }
          <li>
            <button type="button"
                    aria-label="${this.current === this.totalPages ? ["Already on page", this.totalPages].join(" ") : ["Go to page", this.totalPages].join(" ")}"
                    title="${this.current === this.totalPages ? ["Already on page", this.totalPages].join(" ") : ["Go to page", this.totalPages].join(" ")}"
                    ${this.current === this.totalPages ? ["disabled", `aria-disabled="true"`].join(" ") : `data-target="${this.totalPages}"`}
            >
              →
            </button>
          </li>
        </ol>
        <p class="sr-only" aria-live="polite">Page ${this.current} of ${this.totalPages}</p>
      </nav>
    `;
  }

  _refreshTabIndexes() {
    const buttons = [...this.shadow.querySelectorAll("ol button")];
    for (const b of buttons) {
      b.tabIndex = -1;
    }
    const current = this.shadow.querySelector('button[aria-current="page"]');
    const fallback = buttons.find((b) => !b.disabled);
    (current || fallback)?.setAttribute("tabindex", "0");
  }

  _focusCurrentIfNeeded() {
    if (!this._pendingFocus) return;
    const target =
      this.shadow.querySelector('button[aria-current="page"]') ||
      this.shadow.querySelector('button[tabindex="0"]');
    target?.focus();
    this._pendingFocus = false;
  }

  generatePages() {
    const { current, totalPages } = this;
    const maxVisiblePages = 3;
    let start;
    if (current === 1) {
      start = 1;
    } else if (current === totalPages) {
      start = Math.max(1, totalPages - maxVisiblePages + 1);
    } else {
      start = Math.max(1, current - 1);
    }
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  render() {
    this.shadow.innerHTML = this.html;
    this._refreshTabIndexes();
    this._focusCurrentIfNeeded();
  }

  connectedCallback() {
    if (!this._onClick) {
      this._onClick = (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        // ignore 'aria-disabled' current page
        if (btn.getAttribute("aria-disabled") === "true") return;

        if (btn.dataset.target) {
          this._pendingFocus = true; // user-initiated change → refocus after render
          this.current = Number(btn.dataset.target);
        }
      };
      this.shadow.addEventListener("click", this._onClick);
    }

    if (!this._onKeydown) {
      this._onKeydown = (e) => {
        const btn = e.target.closest("button");
        if (!btn || !this.shadow.contains(btn)) return;
        if (e.altKey || e.ctrlKey || e.metaKey) return;

        const set = (page) => {
          if (page < 1 || page > this.totalPages) return;
          this._pendingFocus = true; // refocus to new current
          this.current = page;
        };

        switch (e.key) {
          case "ArrowLeft":
            set(this.current - 1);
            e.preventDefault();
            break;
          case "ArrowRight":
            set(this.current + 1);
            e.preventDefault();
            break;
          case "Home":
            set(1);
            e.preventDefault();
            break;
          case "End":
            set(this.totalPages);
            e.preventDefault();
            break;
          // Do NOT handle 'Tab' / 'Shift+Tab' — let browser manage tab sequence.
          default:
            return;
        }
      };
      this.shadow.addEventListener("keydown", this._onKeydown);
    }

    this.render();
  }

  disconnectedCallback() {
    if (this._onClick) this.shadow.removeEventListener("click", this._onClick);
    if (this._onKeydown)
      this.shadow.removeEventListener("keydown", this._onKeydown);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      if (name === "current") {
        this.dispatchEvent(
          new CustomEvent("page-change", {
            detail: { page: Number(newValue) },
          }),
        );
      }
    }
  }

  get total() {
    return Number.parseInt(this.getAttribute("total") || "0", 10);
  }
  get current() {
    return Number(this.getAttribute("current")) || 1;
  }
  set current(value) {
    this.setAttribute("current", value.toString());
  }
  get pageSize() {
    return Number.parseInt(this.getAttribute("page-size") || "10", 10);
  }
  get totalPages() {
    return Math.ceil(this.total / this.pageSize);
  }
}
globalThis.customElements.define("wc-pagination", WCPagination);
