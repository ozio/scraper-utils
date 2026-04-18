import fetch from 'node-fetch'
import fs from 'fs/promises'
import chalk from 'chalk'
import { createReadStream } from 'fs'
import EventEmitter from 'events'
import { Queue } from '../classes/Queue.mjs'

// https://yandex.com/dev/disk/poligon/

/**
 * @style target
 */
export class YandexDisk extends EventEmitter {
  static API_URL = 'https://cloud-api.yandex.net/v1/disk'
  static UPLOAD_AGENTS = 20

  uploadingFiles = new Set()
  uploadQueue = new Set()
  foldersTree = new Set()

  /**
   * Builds a Yandex Disk client from an OAuth token.
   *
   * @param {string} token
   * @style target
   */
  constructor(token) {
    super()

    this.token = token
  }

  async #request(url, localPath) {
    const { size } = await fs.stat(localPath)
    const stream = createReadStream(localPath)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `OAuth ${this.token}`,
        'Content-Length': size,
      },
      body: stream,
    })

    return response
  }

  async #apiRequest(method, route, params) {
    let tail = ''

    if (params) {
      let entries = Object.entries(params).filter(([, v]) => typeof v !== 'undefined')

      if (entries.length > 0) {
        tail = `?${new URLSearchParams(Object.fromEntries(entries))}`
      }
    }

    const response = await fetch(YandexDisk.API_URL + route + tail, {
      method,
      headers: {
        Authorization: `OAuth ${this.token}`,
      },
    })

    return await response.json()
  }

  /**
   * Returns account storage information.
   *
   * @returns {Promise<{ totalSpace: number, usedSpace: number, trashSize: number, maxFileSize: number }>}
   * @style target
   */
  async info() {
    const info = await this.#apiRequest('GET', '')

    return {
      totalSpace: info.total_space,
      usedSpace: info.used_space,
      trashSize: info.trash_size,
      maxFileSize: info.max_file_size,
    }
  }

  /**
   * Uploads one file to Yandex Disk.
   *
   * @param {{
   *   from: string,
   *   to: string,
   *   overwrite?: boolean,
   *   removeAfterUpload?: boolean,
   * }} [options]
   * @returns {Promise<void>}
   * @style target
   */
  async upload({ from, to, overwrite = false, removeAfterUpload = false } = {}) {
    this.emit('upload-file:start', { localPath: from, remotePath: to })
    this.uploadingFiles.add(from)

    const urlInfo = await this.#apiRequest('GET', '/resources/upload', {
      path: to,
      overwrite,
    })

    let size

    try {
      size = (await fs.stat(from)).size
      await this.#request(urlInfo.href, from)
    } catch (e) {
      this.uploadingFiles.delete(from)
      throw e
    }

    if (removeAfterUpload) {
      await fs.unlink(from)
    }

    this.uploadingFiles.delete(from)
    this.emit('upload-file:finish', { localPath: from, remotePath: to, size })
  }

  /**
   * Returns file metadata for a remote path.
   *
   * @param {{ at: string }} options
   * @returns {Promise<any>}
   * @style target
   */
  async stats({ at }) {
    return this.#apiRequest('GET', '/resources', { path: at })
  }

  async #createFoldersTree(localFolder, remoteFolder) {
    const q = new Queue({
      streams: 5,
      process: async (item) => {
        const remoteFolderPath = item.replace(localFolder, remoteFolder)

        try {
          await this.createDirectory({ at: remoteFolderPath })
        } catch (e) {}
      },
    })

    await q.run([...this.foldersTree])
  }

  async #getFolderTree(localFolder) {
    const list = await fs.readdir(localFolder)

    let tree = []

    for (let i = 0; i < list.length; i++) {
      if (list[i].startsWith('.')) continue

      const fpath = `${localFolder}/${list[i]}`

      if ((await fs.stat(fpath)).isDirectory()) {
        this.foldersTree.add(fpath)
        tree = tree.concat(await this.#getFolderTree(fpath))
      } else {
        tree.push(fpath)
      }
    }

    return tree
  }

  async #runUploadAgent(localFolder, remoteFolder) {
    if (this.uploadQueue.size === 0) return

    let localPath
    let remotePath

    for (let file of this.uploadQueue) {
      if (this.uploadingFiles.has(file)) continue

      localPath = file
      remotePath = file.replace(localFolder, remoteFolder)

      break
    }

    if (!localPath) return

    try {
      await this.upload({ from: localPath, to: remotePath, overwrite: true, removeAfterUpload: true })
      this.uploadQueue.delete(localPath)
    } catch (e) {
      console.log(chalk.red(e.message))
      console.log(chalk.dim(localPath))
    }

    const localFileFolder = localPath.split('/').slice(0, -1).join('/')

    try {
      if (localFolder !== localFileFolder) {
        await fs.rmdir(localFileFolder)
      }
    } catch (e) {}

    return this.#runUploadAgent(localFolder, remoteFolder)
  }

  /**
   * Uploads a local folder tree to Yandex Disk.
   *
   * @param {{ from: string, to: string }} [options]
   * @returns {Promise<void>}
   * @style target
   */
  async uploadDirectory({ from, to } = {}) {
    this.emit('upload-folder:start', { localFolder: from, remoteFolder: to })

    const stats = {
      count: 0,
      size: 0,
    }
    const countStats = ({ size }) => {
      stats.count += 1
      stats.size += size
    }

    const tree = await this.#getFolderTree(from)

    await this.#createFoldersTree(from, to)

    tree.forEach(this.uploadQueue.add, this.uploadQueue)

    this.on('upload-file:finish', countStats)

    await Promise.all(new Array(YandexDisk.UPLOAD_AGENTS).fill(undefined).map(() => this.#runUploadAgent(from, to)))

    this.off('upload-file:finish', countStats)

    this.emit('upload-folder:finish', { localFolder: from, remoteFolder: to, stats })
  }

  /**
   * Creates a remote folder if it does not already exist.
   *
   * @param {{ at: string }} options
   * @returns {Promise<void>}
   * @style target
   */
  async createDirectory({ at }) {
    this.emit('create-folder:start', { remotePath: at })
    await this.#apiRequest('PUT', '/resources', { path: at })
    this.emit('create-folder:finish', { remotePath: at })
  }

  /**
   * Returns account storage information.
   *
   * @returns {Promise<{ totalSpace: number, usedSpace: number, trashSize: number, maxFileSize: number }>}
   * @style legacy
   */
  async getInfo() {
    return this.info()
  }

  /**
   * Uploads one file to Yandex Disk.
   *
   * @param {string} localPath
   * @param {string} remotePath
   * @param {{ overwrite?: boolean, removeAfterUpload?: boolean }} [options]
   * @returns {Promise<void>}
   * @style legacy
   */
  async uploadFile(localPath, remotePath, { overwrite, removeAfterUpload } = {}) {
    return this.upload({
      from: localPath,
      to: remotePath,
      overwrite,
      removeAfterUpload,
    })
  }

  /**
   * Returns file metadata for a remote path.
   *
   * @param {string} file
   * @returns {Promise<any>}
   * @style legacy
   */
  async fileStats(file) {
    return this.stats({ at: file })
  }

  /**
   * Uploads a local folder tree to Yandex Disk.
   *
   * @param {string} localFolder
   * @param {string} remoteFolder
   * @returns {Promise<void>}
   * @style legacy
   */
  async uploadFolder(localFolder, remoteFolder) {
    return this.uploadDirectory({ from: localFolder, to: remoteFolder })
  }

  /**
   * Creates a remote folder if it does not already exist.
   *
   * @param {string} remotePath
   * @returns {Promise<void>}
   * @style legacy
   */
  async createFolder(remotePath) {
    return this.createDirectory({ at: remotePath })
  }
}
