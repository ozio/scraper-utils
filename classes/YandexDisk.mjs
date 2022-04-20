import fetch from 'node-fetch'
import fs from 'fs/promises'
import chalk from 'chalk'
import { createReadStream } from 'fs'

// https://yandex.com/dev/disk/poligon/

const YANDEX_DISK_URL = 'https://cloud-api.yandex.net/v1/disk'

export class YandexDisk {
  currentFolder

  constructor(token) {
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

    const response = await fetch(YANDEX_DISK_URL + route + tail, {
      method,
      headers: {
        Authorization: `OAuth ${this.token}`,
      },
    })

    return await response.json()
  }

  async uploadFile(localPath, remotePath, { overwrite, removeAfterUpload }) {
    console.log(chalk.dim('(' + new Date().toLocaleString('ru') + ')'), remotePath);

    const urlInfo = await this.apiRequest('GET', '/resources/upload', {
      path: remotePath,
      overwrite,
    })

    await this.request(urlInfo.href, localPath)

    if (removeAfterUpload) {
      await fs.unlink(localPath)
    }
  }

  async createLockFile(folder) {
    await fs.writeFile(folder + '/.lock', '')
  }

  async lockFileExist(folder) {
    try {
      await fs.stat(folder + '/.lock')
      return true
    } catch (e) {
      return false
    }
  }

  async removeLockFile(folder) {
    await fs.unlink(folder + '/.lock')
  }

  async removeLastLockFile() {
    await this.removeLockFile(this.currentFolder)
  }

  async uploadFolder(localFolder, remoteFolder, params) {
    if (remoteFolder !== 'IC') {
      await this.createLockFile(localFolder)
    }

    console.log();
    console.log(chalk.bold.cyan(localFolder), '->', chalk.bold.yellow(remoteFolder));

    this.currentFolder = localFolder

    const { removeAfterUpload } = params

    await this.createFolder(remoteFolder)

    const list = (await fs.readdir(localFolder)).filter(f => !f.startsWith('.'))
    let len = list.length

    console.log();

    for (let i = 0; i < len; i++) {
      const fname = list[i]
      const fpath = `${localFolder}/${fname}`
      const fpathRemote = `${remoteFolder}/${fname}`

      let stat

      try {
        stat = await fs.stat(fpath)
      } catch (e) {
        continue
      }

      if (stat.isDirectory()) {
        if (await this.lockFileExist(fpath)) continue

        await this.uploadFolder(fpath, fpathRemote, params)

        if (removeAfterUpload) {
          await this.removeLockFile(fpath)
          await fs.rmdir(fpath)
        }

        continue
      }

      await this.uploadFile(fpath, fpathRemote, params)
    }

  }

  async downloadFile(remotePath) {}

  async createFolder(remotePath) {
    await this.apiRequest('PUT', '/resources', { path: remotePath })
  }
}
