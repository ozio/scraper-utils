import fs from 'fs/promises'
import ffprobe from 'ffprobe-client'
import crypto from 'crypto'

export class Video {
  buffer
  filePath
  meta
  hash

  constructor(filePath, buffer) {
    this.buffer = buffer
    this.filePath = filePath
  }

  async getMeta() {
    if (this.meta) return this.meta

    let meta

    try {
      await fs.lstat(this.filePath)
    } catch (e) {
      throw new Error(`File does not exist: ${this.filePath}`)
    }

    try {
      meta = await ffprobe(this.filePath)
    } catch (e) {
      throw new Error(`Can't read video: ${this.filePath}`)
    }

    this.meta = meta

    return this.meta
  }

  async getBasicInfo() {
    const meta = await this.getMeta()
    const videoStream = meta.streams.find((s) => s.codec_type === 'video')
    const duration = Math.round(parseFloat(meta.format.duration))

    const data = {
      duration,
    }

    if (videoStream) {
      data.width = videoStream.width
      data.height = videoStream.height
    }

    return data
  }

  async getHash() {
    if (this.hash) return this.hash

    this.hash = crypto.createHash('md5').update(this.buffer).digest('hex')

    return this.hash
  }
}
