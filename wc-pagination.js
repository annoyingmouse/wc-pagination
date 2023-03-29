class WCPagination extends HTMLElement {

  static get observedAttributes() {
    return [
      'total',
      'pageSize',
      'current'
    ]
  }

  constructor() {
    super()
    this.shadow = this.attachShadow({
      mode: 'open',
    })
  }

  get css() {
    return `
      <style>
        :host {
          display: inline-block;
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
          background-color: #fff;
          color: #7f8c8d;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          margin: 0 3px;
          border: 1px solid #e5e5e5;
          user-select: none;
        }
        ol li:first-child .content{
          margin-left: 0;        
        }
        ol li:last-child .content{
          margin-right: 0;        
        }
        ol li[aria-current="true"] .content {
          border-color: #2c3e50;
          background-color: #2c3e50;
          color: #fff;
          text-decoration: none;
        }
      </style>
    `
  }

  get html() {
    return `
      <ol aria-label="Pagination Navigation">
        <li onClick="this.getRootNode().host.current = 1"
            aria-label="Go to the first page"
            ${this.current === 1 ? `
              class="disabled"
              disabled
            ` : ''}>
          <div class="content">←</div>
        </li>
        ${(this.totalPages > 3) && ((this.current - 2) >= 1)  ? `
          <li onClick="this.getRootNode().host.current  = this.getRootNode().host.current - 3 < 1 ? 1 : this.getRootNode().host.current - 3"
              aria-label="Jump three pages backward"
              title="Jump three pages backward">
            <div class="content">…</div
          </li>
        ` : ''}
        ${this.generatePages().map(page => `
          <li onClick="this.getRootNode().host.current = ${page}"
              aria-label="${page === this.current ? 'Current page' : 'Go to page ' + page}"
              ${page === this.current ? `aria-current="true"` : ''}>  
            <div class="content">${page}</div>
          </li>
        `).join('')}
        ${(this.totalPages > 3) && ((this.current + 2) <= this.totalPages) ? `
          <li onClick="this.getRootNode().host.current = this.getRootNode().host.current + 3 <= this.getRootNode().host.totalPages ? this.getRootNode().host.current + 3 : this.getRootNode().host.totalPages"
              aria-label="Jump three pages forward"
              title="Jump three pages forward">
            <div class="content">…</div
          </li>
        `: ''}
        <li onClick="this.getRootNode().host.current = this.getRootNode().host.totalPages"
            aria-label="Go to the last page"
            ${this.current === this.totalPages ? `
              class="disabled"
              disabled
            ` : ''}>
          <div class="content">→</div>
        </li>
      </ol>
    `
  }

  generatePages() {
    const arr = []
    if(this.current === 1){
      for(let i = 1, count = 0; i <= this.totalPages && count < 3; i++, count++){
        arr.push(i)
      }
    } else {
      if(this.current === this.totalPages){
        for(let i = this.totalPages, count = 0; i >= 1 && count < 3; i--, count++){
          arr.push(i)
        }
        arr.reverse()
      } else {
        arr.push(this.current)
        if(this.current < this.totalPages){
          arr.push(this.current + 1)
        }
        if(this.current >= 1){
          arr.unshift(this.current - 1)
        }
      }
    }
    return arr
  }

  render() {
    this.totalPages = Math.ceil(this.total / this.pageSize)
    this.shadow.innerHTML = `${this.css}${this.html}`
  }

  connectedCallback() {
    this.render()
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value') {
      this.render()
    } else {
      if (oldValue !== newValue) {
        this.render()
      }
    }
  }

  get total() {
    return Number(this.getAttribute('total'))
  }
  get current() {
    return Number(this.getAttribute('current')) || 1
  }
  set current(value) {
    this.setAttribute('current', value.toString())
  }
  get pageSize() {
    return Number(this.getAttribute('page-size')) || 10
  }
}
window.customElements.define('wc-pagination', WCPagination)
