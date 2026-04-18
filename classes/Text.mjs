import { Nilsimsa } from 'nilsimsa'

/**
 * @style target
 */
export class Text {
  text
  cachedHash

  /**
   * Builds a text wrapper for similarity and hash helpers.
   *
   * @param {string} text
   * @style target
   */
  constructor(text) {
    this.text = text
  }

  /**
   * Returns a cached Nilsimsa hash for the current text.
   *
   * @returns {string}
   * @style target
   */
  hash() {
    if (this.cachedHash) return this.cachedHash

    const nilsimsa = new Nilsimsa()
    nilsimsa.update(this.text)
    this.cachedHash = nilsimsa.digest('hex')

    return this.cachedHash
  }

  /**
   * Compares the current text against another value.
   *
   * @param {string} to
   * @returns {number}
   * @style target
   */
  similarity(to) {
    return Nilsimsa.compare(this.hash(), new Text(to).hash()) / 128
  }

  /**
   * Returns a cached Nilsimsa hash for the current text.
   *
   * @returns {string}
   * @style legacy
   */
  getHash() {
    return this.hash()
  }

  /**
   * Compares the current text against another value.
   *
   * @param {string} text
   * @returns {number}
   * @style legacy
   */
  compare(text) {
    return this.similarity(text)
  }

  /**
   * Returns the original text.
   *
   * @returns {string}
   * @style target
   */
  toString() {
    return this.text
  }
}
