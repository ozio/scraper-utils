import sharp from 'sharp'
import imghash from 'imghash'

const THRESHOLD = 8

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
        .toBuffer()
        .then((buffer) => {
          this.buffer = buffer
          resolve(this)
        })
        .catch(reject)
    })
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

    if ((c(topMiddle, color) && c(bottomMiddle, color)) || (c(leftMiddle, color) && c(rightMiddle, color))) return true

    return false
  }

  async getHash() {
    return imghash.hash(this.buffer, 16)
  }
}
