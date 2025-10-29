class WCPagination extends HTMLElement {
  static get observedAttributes() {
    return ["total", "page-size", "current"];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({
      mode: "open",
    });
  }

  get css() {
    return `
      <style>
        :host {
          display: inline-block;
          --active-border-color: #2c3e50;
          --active-background-color: #2c3e50;
          --inactive-border-color: #e5e5e5;
          --inactive-text-color: #7f8c8d;
          --active-text-color: #fff;
          --inactive-background-color: #fff;
        }
        nav {
          ol {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 0;
            padding: 0;
            list-style: none;
            width: 100%;
            text-align: right;
            li {
              display: inline-block;
              button {
                background: none;
                padding: 0;
                font: inherit;
                cursor: pointer;
                text-decoration: none;
                font-weight: bold;
                background-color: var(--inactive-background-color);
                color: var(--inactive-text-color);
                display: flex;
                align-items: center;
                justify-content: center;
                width: 44px;
                height: 44px;
                border: 1px solid var(--inactive-border-color);
                user-select: none;
                &:focus-visible {
                  outline: 2px solid var(--active-background-color);
                  outline-offset: 2px;
                }
                &:disabled {
                  cursor: not-allowed;
                }
                &[aria-current="page"] {
                  border: none;
                  background-color: var(--active-background-color);
                  color: var(--active-text-color);
                }
              }
            }
          }
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
          }
        }
      </style>
    `;
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
                      data-page="${page}"
                      aria-label="${page === this.current ? ["Current page,", `page ${page}`].join(" ") : ["Go to page", `${page}`].join(" ")}"
                      title="${page === this.current ? ["Current page, page", `${page}`].join(" ") : ["Go to page", `${page}`].join(" ")}"
                      ${page === this.current ? [`aria-current="page"`, "disabled", `aria-disabled="true"`].join(" ") : [`data-target="${page}"`].join(" ")}
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
    this.shadow.innerHTML = `${this.css}${this.html}`;
  }

  connectedCallback() {
    if (!this._onClick) {
      this._onClick = (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        if (btn.dataset.target) this.current = Number(btn.dataset.target);
      };
      this.shadow.addEventListener("click", this._onClick);
    }
    this.render();
  }

  disconnectedCallback() {
    if (this._onClick) {
      this.shadow.removeEventListener("click", this._onClick);
    }
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
