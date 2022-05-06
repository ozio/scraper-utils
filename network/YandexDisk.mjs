import fetch from 'node-fetch'
import fs from 'fs/promises'
import chalk from 'chalk'
import { createReadStream } from 'fs'
import EventEmitter from 'events'

// https://yandex.com/dev/disk/poligon/

export class YandexDisk extends EventEmitter {
  static API_URL = 'https://cloud-api.yandex.net/v1/disk'
  static UPLOAD_AGENTS = 20

  uploadingFiles = new Set()
  uploadQueue = new Set()
  foldersTree = new Set()

  constructor(token) {
    super()

    this.token = token
  }

  async request(url, localPath) {
    const { size } = await fs.stat(localPath)
    const stream = createReadStream(localPath)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `OAuth ${this.token}`,
        'Content-Length': size,
      },
      body: stream,
    })

    return response
  }

  async apiRequest(method, route, params) {
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

  async uploadFile(localPath, remotePath, { overwrite, removeAfterUpload }) {
    this.emit('upload-file:start', localPath, remotePath)
    this.uploadingFiles.add(localPath)

    const urlInfo = await this.apiRequest('GET', '/resources/upload', {
      path: remotePath,
      overwrite,
    })

    try {
      await this.request(urlInfo.href, localPath)
    } catch (e) {
      this.uploadingFiles.delete(localPath)
      throw e
    }

    if (removeAfterUpload) {
      await fs.unlink(localPath)
    }

    this.uploadingFiles.delete(localPath)
    this.emit('upload-file:finish', localPath, remotePath)
  }

  async fileStats(file) {
    return this.apiRequest('GET', '/resources', { path: file })
  }

  async createFoldersTree(localFolder, remoteFolder) {
    for (const localFolderPath of this.foldersTree) {
      const remoteFolderPath = localFolderPath.replace(localFolder, remoteFolder)

      try {
        await this.createFolder(remoteFolderPath)
      } catch (e) {}
    }
  }

  async getFolderTree(localFolder) {
    const list = await fs.readdir(localFolder)

    let tree = []

    for (let i = 0; i < list.length; i++) {
      if (list[i].startsWith('.')) continue

      const fpath = `${localFolder}/${list[i]}`

      if ((await fs.stat(fpath)).isDirectory()) {
        this.foldersTree.add(fpath)
        tree = tree.concat(await this.getFolderTree(fpath))
      } else {
        tree.push(fpath)
      }
    }

    return tree
  }

  async runUploadAgent(localFolder, remoteFolder) {
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
      await this.uploadFile(localPath, remotePath, { overwrite: true, removeAfterUpload: true })
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

    return this.runUploadAgent(localFolder, remoteFolder)
  }

  async uploadFolder(localFolder, remoteFolder, params = {}) {
    this.emit('upload-folder:start', localFolder, remoteFolder)
    const tree = await this.getFolderTree(localFolder)

    await this.createFoldersTree(localFolder, remoteFolder)

    tree.forEach(this.uploadQueue.add, this.uploadQueue)

    await Promise.all(
      new Array(YandexDisk.UPLOAD_AGENTS)
        .fill(undefined)
        .map(() => this.runUploadAgent(localFolder, remoteFolder))
    )
    this.emit('upload-folder:finish', localFolder, remoteFolder)
  }

  async createFolder(remotePath) {
    this.emit('create-folder:start', remotePath)
    await this.apiRequest('PUT', '/resources', { path: remotePath })
    this.emit('create-folder:finish', remotePath)
  }
}
