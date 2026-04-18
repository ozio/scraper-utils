import parse from 'node-html-parser'

/**
 * @style target
 */
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

  /**
   * Builds a page instance from HTML and optional metadata.
   *
   * @param {{ url?: string, html: string, timestamp?: number }} options
   * @style target
   */
  constructor({ url, html, timestamp }) {
    this.#p({ url, html, timestamp })
  }

  /**
   * Replaces the current page contents and metadata.
   *
   * @param {{ url?: string, html: string, timestamp?: number }} options
   * @style target
   */
  update({ url, html, timestamp }) {
    this.#p({ url, html, timestamp })
  }

  /**
   * Returns structured page data.
   *
   * Subclasses can override this method to expose extracted fields.
   *
   * @returns {Record<string, any>}
   * @style target
   */
  data() {
    return {}
  }

  /**
   * Returns structured page data.
   *
   * @returns {Record<string, any>}
   * @style legacy
   */
  getData() {
    console.warn('Warning: getData() method is empty')

    return this.data()
  }
}
