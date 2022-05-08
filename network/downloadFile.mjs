import { unlink } from 'fs/promises'
import { createWriteStream } from 'fs'
import progress from 'progress-stream'
import https from 'https'

const files = new Set()

const processErrorHandler = async () => {
  for (const file of files) {
    await unlink(file)
  }

  process.exit()
}

process.on('SIGINT', processErrorHandler)
process.on('SIGTERM', processErrorHandler)

export const downloadFile = async (remotePath, localPath, { onProgress, agent, signal } = {}) => {
  const promise = new Promise((resolve, reject) => {
    const file = createWriteStream(localPath)
    files.add(localPath)

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
          onProgress,
        )

        response.pipe(str)
          .pipe(file)
      } else {
        response.pipe(file)
      }
    })

    request.on('error', (err) => {
      if (err.code === 'ECONNRESET') {
        // https://stackoverflow.com/a/50821286/10733340
        console.log('Timeout occurs')
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
    files.delete(localPath)
  })

  return promise
}
