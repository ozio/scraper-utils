import fs from 'fs/promises'
import ffprobe from 'ffprobe-client'
import crypto from 'crypto'

/**
 * @style target
 */
export class Video {
  buffer
  filePath
  meta
  cachedHash

  /**
   * Loads a video wrapper from a file path and optional in-memory buffer.
   *
   * @param {{ filePath: string, buffer?: Buffer }} options
   * @returns {Video}
   * @style target
   */
  static load({ filePath, buffer }) {
    return new Video(filePath, buffer)
  }

  /**
   * Builds a video wrapper.
   *
   * @param {string} filePath
   * @param {Buffer} buffer
   * @style legacy
   */
  constructor(filePath, buffer) {
    this.buffer = buffer
    this.filePath = filePath
  }

  /**
   * Reads and caches ffprobe metadata for the video file.
   *
   * @returns {Promise<any>}
   * @style target
   */
  async metadata() {
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

  /**
   * Returns basic width, height, and duration information.
   *
   * @returns {Promise<{ duration: number, width?: number, height?: number }>}
   * @style target
   */
  async basicInfo() {
    const meta = await this.metadata()
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

  /**
   * Returns an MD5 hash of the in-memory video buffer.
   *
   * @returns {Promise<string>}
   * @style target
   */
  async hash() {
    if (this.cachedHash) return this.cachedHash

    this.cachedHash = crypto.createHash('md5').update(this.buffer).digest('hex')

    return this.cachedHash
  }

  /**
   * Reads and caches ffprobe metadata for the video file.
   *
   * @returns {Promise<any>}
   * @style legacy
   */
  async getMeta() {
    return this.metadata()
  }

  /**
   * Returns basic width, height, and duration information.
   *
   * @returns {Promise<{ duration: number, width?: number, height?: number }>}
   * @style legacy
   */
  async getBasicInfo() {
    return this.basicInfo()
  }

  /**
   * Returns an MD5 hash of the in-memory video buffer.
   *
   * @returns {Promise<string>}
   * @style legacy
   */
  async getHash() {
    return this.hash()
  }
}
