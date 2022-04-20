import { parse } from 'node-html-parser'

export class Page {
  cache = {}

  constructor({ url, html }) {
    if (url) {
      this.url = new URL(url)
    }
    this.html = html
    this.root = parse(html, {
      blockTextElements: {
        script: true,
      }
    })
  }

  update({ url, html }) {
    if (url) {
      this.url = new URL(url)
    }
    this.html = html
    this.root = parse(html, {
      blockTextElements: {
        script: true,
      }
    })
  }
}
