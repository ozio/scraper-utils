import https from 'https'
import fs from 'fs'
import crypto from 'crypto'

const noop = () => {}

export const download = (url, dest, { agent, signal, onProgress }) => {
  if (!dest) {
    const format = url.split('.').slice(-1).join('')
    dest = `/tmp/${crypto.randomBytes(20).toString('hex')}.${format}`
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

    const request = https.get(url, { agent }, (response) => {
      status = response.statusCode

      if (response.statusCode !== 200) {
        file.close()
        fs.unlink(dest, noop)
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
      fs.unlink(dest, noop)
      reject(err)
    })

    file.on('error', (err) => {
      file.close()
      fs.unlink(dest, noop)
      reject(err)
    })

    file.on('finish', () => {
      file.close()
      resolve({ status, dest })
    })

    if (signal) {
      signal.addEventListener('abort', () => {
        file.close()
        fs.unlink(dest, noop)
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
