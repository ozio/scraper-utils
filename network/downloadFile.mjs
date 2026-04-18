import { unlink } from 'fs/promises'
import { createWriteStream } from 'fs'
import progress from 'progress-stream'
import https from 'https'
import { ensureParentDirectory } from '../fs/file.mjs'

const dowloadingFiles = new Set()

const processErrorHandler = async () => {
  for (const file of dowloadingFiles) {
    await unlink(file)
  }

  process.exit()
}

process.on('SIGINT', processErrorHandler)
process.on('SIGTERM', processErrorHandler)

const downloadFileToPath = async (remotePath, localPath, { onProgress, agent, signal } = {}) => {
  const promise = new Promise((resolve, reject) => {
    const file = createWriteStream(localPath)
    dowloadingFiles.add(localPath)

    let statusCode
    let aborted = false

    const request = https.get(remotePath, { agent }, (response) => {
      statusCode = response.statusCode
      let contentLength = parseInt(response.headers['content-length'])

      if (statusCode > 400) {
        file.close()
        unlink(localPath)
        resolve({ response, statusCode, localPath, remotePath })
        return
      }

      if (onProgress) {
        const str = progress(
          {
            length: contentLength,
            time: 100,
          },
          onProgress
        )

        response.pipe(str).pipe(file)
      } else {
        response.pipe(file)
      }
    })

    request.on('error', (err) => {
      if (err.code === 'ECONNRESET') {
        // https://stackoverflow.com/a/50821286/10733340
        return
      }

      file.close()
      unlink(localPath)
      reject(err)
    })

    file.on('error', (err) => {
      file.close()
      unlink(localPath)
      reject(err)
    })

    file.on('finish', () => {
      file.close()
      resolve({ statusCode, localPath, aborted })
    })

    if (signal) {
      signal.addEventListener('abort', () => {
        aborted = true
        file.close()
        unlink(localPath)
        request.destroy()
      })
    }
  })

  promise.finally(() => {
    dowloadingFiles.delete(localPath)
  })

  return promise
}

/**
 * Downloads a remote file into a destination path.
 *
 * @param {{ from: string, to: string, onProgress?: Function, agent?: https.Agent, signal?: AbortSignal, createDirectories?: boolean }} options
 * @returns {ReturnType<typeof downloadFileToPath>}
 * @style target
 */
export const downloadFile = async ({ from, to, onProgress, agent, signal, createDirectories = false } = {}) => {
  if (createDirectories) {
    await ensureParentDirectory({ for: to })
  }

  return downloadFileToPath(from, to, {
    onProgress,
    agent,
    signal,
  })
}
