import https from 'https'
import fs from 'fs'
import crypto from 'crypto'
import { downloadFile } from './downloadFile.mjs'

const noop = () => {}

const unlink = (dest) => {
  try {
    fs.unlink(dest, noop)
  } catch (e) {}
}

/**
 * Downloads a remote file into a temporary path.
 *
 * @param {{ from: string, agent?: import('https').Agent, signal?: AbortSignal, onProgress?: Function }} [options]
 * @returns {Promise<{ statusCode?: number, localPath: string, aborted?: boolean, status?: number, dest?: string }>}
 * @style target
 */
export const downloadTemporaryFile = async ({ from, agent, signal, onProgress } = {}) => {
  const format = from.split('.').slice(-1).join('')
  const to = `/tmp/${crypto.randomBytes(20).toString('hex')}.${format}`

  return downloadFile({
    from,
    to,
    agent,
    signal,
    onProgress,
  })
}

/**
 * @style legacy
 */
export const download = (url, dest, { agent, signal, onProgress } = {}) => {
  if (!dest) {
    return downloadTemporaryFile({
      from: url,
      agent,
      signal,
      onProgress,
    }).then(({ localPath, statusCode, aborted }) => ({
      status: statusCode,
      dest: localPath,
      aborted,
    }))
  }

  let count = 0

  const handler = () => {
    fs.unlink(dest, (err) => {
      if (!err) console.log('Не загруженный файл удалён:', dest)

      count++
    })

    if (count === 2) {
      count = 0
      process.exit()
    }
  }

  process.on('SIGINT', handler)
  process.on('SIGTERM', handler)

  const promise = new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)

    let full
    let downloaded = 0
    let status
    let aborted = false

    const request = https.get(url, { agent }, (response) => {
      status = response.statusCode

      if (response.statusCode !== 200) {
        file.close()
        unlink(dest)
        resolve({ status, dest })
        return
      }

      if (onProgress) {
        response.on('data', (chunk) => {
          downloaded += chunk.length

          onProgress(Math.round((downloaded / full) * 10000) / 100)
        })
      }

      full = parseInt(response.headers['content-length'])

      response.pipe(file)
    })

    request.on('error', (err) => {
      file.close()
      unlink(dest)

      if (err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
        // https://stackoverflow.com/a/50821286/10733340
        return
      }

      if (err.message === 'SocksClientError: Proxy connection timed out') {
        // kek?
        return
      }

      if (err.message === 'SocksClientError: Socket closed') {
        // kek?
        return
      }

      console.log('request error', err)
      console.log('request code', `"${err.code}"`)
      console.log('request message', `"${err.message}"`)

      reject(err)
    })

    file.on('error', (err) => {
      console.log('file error', err)

      file.close()
      unlink(dest)
      reject(err)
    })

    file.on('finish', () => {
      file.close()
      resolve({ status, dest, aborted })
    })

    if (signal) {
      signal.addEventListener('abort', () => {
        aborted = true
        file.close()
        unlink(dest)
        request.destroy()
      })
    }
  })

  promise.finally(() => {
    process.off('SIGINT', handler)
    process.off('SIGTERM', handler)
  })

  return promise
}
