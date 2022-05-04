import { createReadStream, createWriteStream } from 'fs'
import { stat, unlink } from 'fs/promises'
import { createGunzip, createGzip } from 'zlib'
import { pipeline } from 'stream/promises'
import progress from 'progress-stream'
import { streamToString as toString } from '../helpers/streamToString.mjs'

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

    await pipeline(source, str, gzip, destination)
  }

  await pipeline(source, gzip, destination)

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

    await pipeline(source, str, ungzip, destination)
  } else {
    await pipeline(source, ungzip, destination)
  }

  if (removeOriginalFile) {
    await unlink(inputPath)
  }
}

export const readArchivedFile = async (inputPath) => {
  const source = createReadStream(inputPath)
  const ungzip = createGunzip()

  return pipeline(source, ungzip, toString)
}
