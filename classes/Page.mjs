import { parse } from 'node-html-parser'

export class Page {
  cache = {}

  #p({ url, html, timestamp }) {
    if (url) {
      this.url = new URL(url)
    }
    this.timestamp = timestamp
    this.html = html
    this.root = parse(html, {
      blockTextElements: {
        script: true,
      },
    })
  }

  constructor({ url, html, timestamp }) {
    this.#p({ url, html, timestamp })
  }

  update({ url, html, timestamp }) {
    this.#p({ url, html, timestamp })
  }

  getData() {
    console.warn('Warning: getData() method is empty');

    return {}
  }
}
