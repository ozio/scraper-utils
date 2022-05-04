import { createReadStream, createWriteStream } from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import { createGzip, createGunzip } from 'zlib'
import { unlink, stat, copyFile as cp } from 'fs/promises'
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

    await pipe(source, str, gzip, destination)
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

export const removeFile = async (filePath) => {
  await unlink(filePath)
}

export const copyFile = async (inputPath, outputPath, { onProgress } = {}) => {
  if (onProgress) {
    const { size } = await stat(inputPath)
    const source = createReadStream(inputPath)
    const destination = createWriteStream(outputPath)

    const str = progress({
      length: size,
      time: 100,
    }, onProgress)

    await pipe(source, str, destination)
  } else {
    await cp(inputPath, outputPath)
  }
}

export const moveFile = async (inputPath, outputPath, { onProgress } = {}) => {
  await copyFile(inputPath, outputPath, { onProgress })
  await removeFile(inputPath)
}
