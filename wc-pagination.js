class WCPagination extends HTMLElement {
  static get observedAttributes() {
    return ["total", "pageSize", "current", "action"];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({
      mode: "closed",
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
        ol {
          display: flex;
          align-items: center;
          margin: 0;
          padding: 0;
          list-style-type: none;
          width: 100%;
          text-align: right;
        }
        ol li {
          display: inline-block;
          cursor: pointer;
        }
        ol li.disabled {
          cursor: not-allowed;
        }
        ol li .content {
          text-decoration: none;
          font-weight: bold;
          background-color: var(--inactive-background-color);
          color: var(--inactive-text-color);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          margin: 0 3px;
          border: 1px solid var(--inactive-border-color);
          user-select: none;
        }
        ol li:first-child .content{
          margin-left: 0;        
        }
        ol li:last-child .content{
          margin-right: 0;        
        }
        ol li[aria-current="true"] .content {
          border-color: var(--active-border-color);
          background-color: var(--active-background-color);
          color: var(--active-text-color);
          text-decoration: none;
        }
      </style>
    `;
  }

  get html() {
    return `
      <ol aria-label="Pagination Navigation">
        <li onClick="this.getRootNode().host.current = 1"
          aria-label="${this.current === 1 ? "Already on the first page" : "Go to the first page"}"
          title="${this.current === 1 ? "Already on the first page" : "Go to the first page"}"
          ${this.current === 1 ? `class="disabled"` : ""}
          ${this.current === 1 ? "disabled aria-disabled" : ""}
        }>
          <div class="content">←</div>
        </li>
        ${
          (this.totalPages > 3) && (this.current - 2 >= 1)
            ? `
          <li onClick="this.getRootNode().host.current  = this.getRootNode().host.current - 3 < 1 ? 1 : this.getRootNode().host.current - 3"
              aria-label="Jump three pages backward"
              title="Jump three pages backward">
            <div class="content">…</div
          </li>
        `
            : ""
        }
        ${this.generatePages()
          .map(
            (page) => `
          <li onClick="this.getRootNode().host.current = ${page}"
              aria-label="${page === this.current ? "Current page" : "Go to page " + page}"
              title="${page === this.current ? "Current page" : "Go to page " + page}"
              ${page === this.current ? `aria-current="true"` : ""}>  
            <div class="content">${page}</div>
          </li>
        `,
          )
          .join("")}
        ${
          (this.totalPages > 3) && (this.current + 2 <= this.totalPages)
            ? `
          <li onClick="this.getRootNode().host.current = this.getRootNode().host.current + 3 <= this.getRootNode().host.totalPages ? this.getRootNode().host.current + 3 : this.getRootNode().host.totalPages"
              aria-label="Jump three pages forward"
              title="Jump three pages forward">
            <div class="content">…</div
          </li>
        `
            : ""
        }
        <li onClick="this.getRootNode().host.current = this.getRootNode().host.totalPages"
            aria-label="${this.current === this.totalPages ? "Already on the last page" : "Go to the last page"}"
            title="${this.current === this.totalPages ? "Already on the last page" : "Go to the last page"}"
            ${this.current === this.totalPages ? `class="disabled"` : ""}
            ${this.current === this.totalPages ? "disabled aria-disabled" : ""}
        }>
          <div class="content">→</div>
        </li>
      </ol>
    `;
  }

  generatePages() {
    const { current, totalPages } = this;
    const maxVisiblePages = 3;

    // 1. Determine the 'start' page of the range.
    let start;
    if (current === 1) {
      // If on the first page, start at 1.
      start = 1;
    } else if (current === totalPages) {
      // If on the last page, start at the largest number
      // that still allows for 'maxVisiblePages' before the end.
      start = Math.max(1, totalPages - maxVisiblePages + 1);
    } else {
      // If in the middle, start one page before the current page.
      start = Math.max(1, current - 1);
    }

    // 2. Determine the 'end' page of the range.
    // The range should end either 3 pages after the start, or at totalPages, whichever is smaller.
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    // 3. Generate the array.
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  render() {
    this.totalPages = Math.ceil(this.total / this.pageSize);
    this.shadow.innerHTML = `${this.css}${this.html}`;
  }

  connectedCallback() {
    this.render();
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
    return Number(this.getAttribute("total"));
  }
  get current() {
    return Number(this.getAttribute("current")) || 1;
  }
  set current(value) {
    this.setAttribute("current", value.toString());
  }
  get pageSize() {
    return Number(this.getAttribute("page-size")) || 10;
  }
}
globalThis.customElements.define("wc-pagination", WCPagination);
