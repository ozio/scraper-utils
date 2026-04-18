import fs from 'node:fs'
import assert from 'node:assert'
import sharp from 'sharp'
import imghash from 'imghash'

const THRESHOLD = 8
const HASH_COMPLEXITY = 16

function px(pixels, width, x, y) {
  const pixel = width * y + x

  assert(pixel < pixels.length)

  return pixels[pixel]
}

function binaryToHex(s) {
  let output = ''

  for (let i = 0; i < s.length; i += 4) {
    const bytes = s.substring(i, i + 4)
    const decimal = parseInt(bytes, 2)
    const hex = decimal.toString(16)

    output += hex
  }

  return new Buffer(output, 'hex')
}

const c = (c1, c2, t = THRESHOLD) => {
  //console.log(c1, '===', c2)
  //console.log(c1[0] - t, '...', c2[0], '...', c1[0] + t)
  //console.log(c1[1] - t, '...', c2[1], '...', c1[1] + t)
  //console.log(c1[2] - t, '...', c2[2], '...', c1[2] + t)

  if (!(c1[0] - t <= c2[0] && c1[0] + t >= c2[0])) {
    return false
  }

  if (!(c1[1] - t <= c2[1] && c1[1] + t >= c2[1])) {
    return false
  }

  if (!(c1[2] - t <= c2[2] && c1[2] + t >= c2[2])) {
    return false
  }

  return true
}

/**
 * @style target
 */
export class Image {
  image
  buffer
  meta

  /**
   * Loads an image wrapper from a file path.
   *
   * @param {{ from: string }} options
   * @returns {Image}
   * @style target
   */
  static load({ from }) {
    return new Image(from)
  }

  #applyBuffer = async (buffer, info) => {
    this.buffer = buffer
    this.image = sharp(this.buffer)
    this.meta = info || (await this.image.metadata())
  }

  /**
   * Builds an image wrapper from a file path or raw buffer.
   *
   * @param {string | Buffer} buffer
   * @style legacy
   */
  constructor(buffer) {
    if (typeof buffer === 'string') {
      buffer = fs.readFileSync(buffer)
    }

    this.buffer = buffer
    this.image = sharp(this.buffer)
  }

  /**
   * Returns cached image metadata.
   *
   * @returns {Promise<import('sharp').Metadata>}
   * @style target
   */
  async metadata() {
    if (this.meta) {
      return this.meta
    }

    this.meta = await this.image.metadata()

    return this.meta
  }

  /**
   * Trims image borders using a color threshold.
   *
   * @param {{ threshold?: number }} [options]
   * @returns {Promise<Image>}
   * @style target
   */
  async trim({ threshold = THRESHOLD } = {}) {
    const { data, info } = await this.image.trim(threshold).toBuffer({ resolveWithObject: true })
    await this.#applyBuffer(data, info)
    return this
  }

  /**
   * Resizes the image to a centered square.
   *
   * @returns {Promise<Image>}
   * @style target
   */
  async makeSquare() {
    const { width, height } = await this.metadata()
    const min = Math.min(width, height)
    const buffer = await this.image.resize(min, min, { fit: 'cover' }).toBuffer()

    await this.#applyBuffer(buffer)
    return this
  }

  async #pixelColor(image, x, y) {
    const { data } = await image.extract({ width: 1, height: 1, left: x, top: y }).raw().toBuffer({
      resolveWithObject: true,
    })

    return data.toJSON().data
  }

  /**
   * Detects whether the image has solid borders.
   *
   * @returns {Promise<boolean>}
   * @style target
   */
  async hasBorders() {
    const { width, height } = await this.metadata()

    const clone = this.image.clone()

    let leftTop, rightBottom, rightTop, leftBottom, topMiddle, bottomMiddle, leftMiddle, rightMiddle

    leftTop = await this.#pixelColor(clone, 0, 0)
    rightBottom = await this.#pixelColor(clone, width - 1, height - 1)

    if (!c(leftTop, rightBottom)) return false

    const color = leftTop

    rightTop = await this.#pixelColor(clone, width - 1, 0)
    leftBottom = await this.#pixelColor(clone, 0, height - 1)

    if (!c(rightTop, color) || !c(leftBottom, color)) return false

    topMiddle = await this.#pixelColor(clone, Math.round(width / 2), 0)
    bottomMiddle = await this.#pixelColor(clone, Math.round(width / 2), height - 1)
    leftMiddle = await this.#pixelColor(clone, 0, Math.round(height / 2))
    rightMiddle = await this.#pixelColor(clone, width - 1, Math.round(height / 2))

    if ((c(topMiddle, color) && c(bottomMiddle, color)) || (c(leftMiddle, color) && c(rightMiddle, color))) return true

    return false
  }

  /**
   * Returns a perceptual hash for the image.
   *
   * @param {{ complexity?: number }} [options]
   * @returns {Promise<string>}
   * @style target
   */
  async perceptualHash({ complexity = HASH_COMPLEXITY } = {}) {
    return imghash.hash(this.buffer, complexity)
  }

  /**
   * Returns a difference hash for the image.
   *
   * @param {{ complexity?: number }} [options]
   * @returns {Promise<string>}
   * @style target
   */
  async differenceHash({ complexity = HASH_COMPLEXITY } = {}) {
    const height = complexity
    const width = height + 1

    return this.image
      .clone()
      .grayscale()
      .resize(width, height, { fit: 'fill' })
      .raw()
      .toBuffer()
      .then((pixels) => {
        // Compare adjacent pixels.
        let difference = ''

        for (let row = 0; row < height; row++) {
          for (let col = 0; col < height; col++) {
            // height is not a mistake here...
            let left = px(pixels, width, col, row)
            let right = px(pixels, width, col + 1, row)
            difference += left < right ? 1 : 0
          }
        }
        return BigInt(`0b${difference}`).toString(16) // binaryToHex(difference).toString()
      })
  }

  /**
   * Returns the dominant image color.
   *
   * @returns {Promise<{ r: number, g: number, b: number }>}
   * @style target
   */
  async dominantColor() {
    const { dominant } = await this.image.stats()

    return dominant
  }

  /**
   * Returns the average image color.
   *
   * @returns {Promise<{ r: number, g: number, b: number }>}
   * @style target
   */
  async averageColor() {
    const color = await this.#pixelColor(this.image.clone().resize(1, 1, { fit: 'fill' }), 0, 0)

    return { r: color[0], g: color[1], b: color[2] }
  }

  /**
   * Returns current image dimensions.
   *
   * @returns {Promise<{ width: number, height: number }>}
   * @style target
   */
  async dimensions() {
    const { width, height } = await this.metadata()

    return { width, height }
  }

  /**
   * Returns the current image aspect ratio.
   *
   * @returns {Promise<number>}
   * @style target
   */
  async aspectRatio() {
    const { width, height } = await this.metadata()

    return width / height
  }

  /**
   * Returns cached image metadata.
   *
   * @returns {Promise<import('sharp').Metadata>}
   * @style legacy
   */
  async getMeta() {
    return this.metadata()
  }

  /**
   * Trims image borders using a color threshold.
   *
   * @param {number} threshold
   * @returns {Promise<Image>}
   * @style legacy
   */
  async crop(threshold = THRESHOLD) {
    return this.trim({ threshold })
  }

  /**
   * Resizes the image to a centered square.
   *
   * @returns {Promise<Image>}
   * @style legacy
   */
  async square() {
    return this.makeSquare()
  }

  /**
   * Returns a perceptual hash for the image.
   *
   * @param {number} complexity
   * @returns {Promise<string>}
   * @style legacy
   */
  async getHash(complexity) {
    return this.perceptualHash({ complexity })
  }

  /**
   * Returns a perceptual hash for the image.
   *
   * @param {number} complexity
   * @returns {Promise<string>}
   * @style legacy
   */
  async getPHash(complexity = HASH_COMPLEXITY) {
    return this.perceptualHash({ complexity })
  }

  /**
   * Returns a difference hash for the image.
   *
   * @param {number} complexity
   * @returns {Promise<string>}
   * @style legacy
   */
  async getDHash(complexity = HASH_COMPLEXITY) {
    return this.differenceHash({ complexity })
  }

  /**
   * Returns the dominant image color.
   *
   * @returns {Promise<{ r: number, g: number, b: number }>}
   * @style legacy
   */
  async getDominantColor() {
    return this.dominantColor()
  }

  /**
   * Returns the average image color.
   *
   * @returns {Promise<{ r: number, g: number, b: number }>}
   * @style legacy
   */
  async getAverageColor() {
    return this.averageColor()
  }

  /**
   * Returns current image dimensions.
   *
   * @returns {Promise<{ width: number, height: number }>}
   * @style legacy
   */
  async getDimentions() {
    return this.dimensions()
  }

  /**
   * Returns the current image aspect ratio.
   *
   * @returns {Promise<number>}
   * @style legacy
   */
  async getRatio() {
    return this.aspectRatio()
  }
}
