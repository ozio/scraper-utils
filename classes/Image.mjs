import fs from 'node:fs'
import assert from 'node:assert'
import sharp from 'sharp'
import imghash from 'imghash'

const THRESHOLD = 8
const HASH_COMPLEXITY = 16

function px(pixels, width, x, y) {
  const pixel = width * y + x

  assert(pixel < pixels.length);

  return pixels[pixel];
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

export class Image {
  image
  buffer
  meta

  constructor(buffer) {
    if (typeof buffer === 'string') {
      buffer = fs.readFileSync(buffer)
    }

    this.buffer = buffer
    this.image = sharp(this.buffer)
  }

  async getMeta() {
    return new Promise((resolve, reject) => {
      if (this.meta) {
        resolve(this.meta)
        return
      }

      this.image
        .metadata()
        .then((meta) => {
          this.meta = meta
          resolve(this.meta)
        })
        .catch(reject)
    })
  }

  async crop(threshold = THRESHOLD) {
    return new Promise((resolve, reject) => {
      this.image
        .trim(threshold)
        .toBuffer((err, buffer, info) => {
          if (err) reject(err)

          this.buffer = buffer
          this.meta = {...this.meta, ...info }
          resolve(this)
        })
    })
  }

  async square() {
    const min = Math.min(this.meta.width, this.meta.height)

    this.meta.width = min
    this.meta.height = min

    await this.image.resize(min, min, { fill: 'cover' })

    this.buffer = await this.image.toBuffer()
  }

  async getPixelColor(image, x, y) {
    return new Promise((resolve, reject) => {
      image
        .extract({ width: 1, height: 1, left: x, top: y })
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ data }) => {
          resolve(data.toJSON().data)
        })
        .catch(reject)
    })
  }

  async hasBorders() {
    const { width, height } = await this.getMeta()

    const clone = this.image.clone()

    let leftTop, rightBottom, rightTop, leftBottom, topMiddle, bottomMiddle, leftMiddle, rightMiddle

    leftTop = await this.getPixelColor(clone, 0, 0)
    rightBottom = await this.getPixelColor(clone, width - 1, height - 1)

    if (!c(leftTop, rightBottom)) return false

    const color = leftTop

    rightTop = await this.getPixelColor(clone, width - 1, 0)
    leftBottom = await this.getPixelColor(clone, 0, height - 1)

    if (!c(rightTop, color) || !c(leftBottom, color)) return false

    topMiddle = await this.getPixelColor(clone, Math.round(width / 2), 0)
    bottomMiddle = await this.getPixelColor(clone, Math.round(width / 2), height - 1)
    leftMiddle = await this.getPixelColor(clone, 0, Math.round(height / 2))
    rightMiddle = await this.getPixelColor(clone, width - 1, Math.round(height / 2))

    if (
      (c(topMiddle, color) && c(bottomMiddle, color)) ||
      (c(leftMiddle, color) && c(rightMiddle, color))
    )
      return true

    return false
  }

  /* deprecated */
  async getHash(complexity) {
    return this.getPHash(complexity)
  }

  async getPHash(complexity = HASH_COMPLEXITY) {
    return imghash.hash(this.buffer, complexity)
  }

  async getDHash(complexity = HASH_COMPLEXITY) {
    const height = complexity
    const width = height + 1

    return this.image
      .clone()
      .grayscale()
      .resize(width, height, { fit: 'fill' })
      .raw()
      .toBuffer()
      .then(function(pixels) {
        // Compare adjacent pixels.
        let difference = ''

        for (let row = 0; row < height; row++) {
          for (let col = 0; col < height; col++) { // height is not a mistake here...
            let left = px(pixels, width, col, row)
            let right = px(pixels, width, col + 1, row)
            difference += left < right ? 1 : 0
          }
        }
        return BigInt(`0b${difference}`).toString(16) // binaryToHex(difference).toString()
      })
  }

  async getDominantColor() {
    const { dominant } = await this.image.stats()

    return dominant
  }

  async getAverageColor() {
    const color = await this.getPixelColor(this.image.clone().resize(1, 1, 'fit'), 0, 0)

    return { r: color[0], g: color[1], b: color[2] }
  }

  async getDimentions() {
    return { width: this.meta.width, height: this.meta.height }
  }

  async getRatio() {
    return this.meta.width / this.meta.height
  }
}
