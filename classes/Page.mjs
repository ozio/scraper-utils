import { parse } from 'node-html-parser'

export class Page {
  cache = {}

  #p({ url, html }) {
    if (url) {
      this.url = new URL(url)
    }
    this.html = html
    this.root = parse(html, {
      blockTextElements: {
        script: true,
      },
    })
  }

  constructor({ url, html }) {
    this.#p({ url, html })
  }

  update({ url, html }) {
    this.#p({ url, html })
  }
}
