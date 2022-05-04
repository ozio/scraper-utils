import { createReadStream, createWriteStream } from 'fs'
import { stat, unlink } from 'fs/promises'
import { createGunzip, createGzip } from 'zlib'
import { promisify } from 'util'
import { pipeline } from 'stream'
import progress from 'progress-stream'

const pipe = promisify(pipeline)

export const archiveFile = async (inputPath, { outputPath, onProgress, removeOriginalFile } = {}) => {
  const gzip = createGzip()
  const source = createReadStream(inputPath)
  const destination = createWriteStream(outputPath ? outputPath : `${inputPath}.gz`)

  if (onProgress) {
    const { size } = await stat(inputPath)
    const str = progress({
      length: size,
      time: 100,
    }, onProgress)

    await pipe(source, gzip, str, destination)
  }

  await pipe(source, gzip, destination)

  if (removeOriginalFile) {
    await unlink(inputPath)
  }
}

export const unarchiveFile = async (inputPath, { outputPath, onProgress, removeOriginalFile } = {}) => {
  const ungzip = createGunzip()
  const source = createReadStream(inputPath)
  const destination = createWriteStream(outputPath ? outputPath : inputPath.slice(0, -3))

  if (onProgress) {
    const { size } = await stat(inputPath)
    const str = progress({
      length: size,
      time: 500,
    }, onProgress)

    await pipe(source, str, ungzip, destination)
  } else {
    await pipe(source, ungzip, destination)
  }

  if (removeOriginalFile) {
    await unlink(inputPath)
  }
}
