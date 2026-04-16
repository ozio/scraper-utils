import { createReadStream, createWriteStream } from 'fs'
import { stat, unlink } from 'fs/promises'
import { createGunzip, createGzip } from 'zlib'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import progress from 'progress-stream'
import { streamToString as toString } from '../helpers/streamToString.mjs'
import { ensureParentDirectory } from './file.mjs'

export const archiveFile = async (inputPath, { outputPath, onProgress, removeOriginalFile } = {}) => {
  const gzip = createGzip()
  const source = createReadStream(inputPath)
  const destination = createWriteStream(outputPath ? outputPath : `${inputPath}.gz`)

  if (onProgress) {
    const { size } = await stat(inputPath)
    const str = progress(
      {
        length: size,
        time: 100,
      },
      onProgress
    )

    await pipeline(source, str, gzip, destination)
  } else {
    await pipeline(source, gzip, destination)
  }

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
    const str = progress(
      {
        length: size,
        time: 500,
      },
      onProgress
    )

    await pipeline(source, str, ungzip, destination)
  } else {
    await pipeline(source, ungzip, destination)
  }

  if (removeOriginalFile) {
    await unlink(inputPath)
  }
}

export const writeArchivedFile = async (outputPath, contents) => {
  const fromString = Readable.from([contents])
  const gzip = createGzip()
  const destination = createWriteStream(outputPath)

  await pipeline(fromString, gzip, destination)
}

export const readArchivedFile = async (inputPath) => {
  const source = createReadStream(inputPath)
  const ungzip = createGunzip()

  return pipeline(source, ungzip, toString)
}

/**
 * Archives a file into gzip format.
 *
 * @param {{ from: string, to?: string, onProgress?: Function, removeOriginalFile?: boolean, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 *
 * @example
 * await archiveFileFrom({
 *   from: '/tmp/report.html',
 *   to: '/tmp/report.html.gz',
 * })
 */
export const archiveFileFrom = async ({
  from,
  to,
  onProgress,
  removeOriginalFile = false,
  createDirectories = false,
} = {}) => {
  const outputPath = to ? to : `${from}.gz`

  if (createDirectories) {
    await ensureParentDirectory({ for: outputPath })
  }

  await archiveFile(from, {
    outputPath,
    onProgress,
    removeOriginalFile,
  })
}

/**
 * Restores a gzip archive into a plain file.
 *
 * @param {{ from: string, to?: string, onProgress?: Function, removeOriginalFile?: boolean, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 */
export const unarchiveFileFrom = async ({
  from,
  to,
  onProgress,
  removeOriginalFile = false,
  createDirectories = false,
} = {}) => {
  const outputPath = to ? to : from.slice(0, -3)

  if (createDirectories) {
    await ensureParentDirectory({ for: outputPath })
  }

  await unarchiveFile(from, {
    outputPath,
    onProgress,
    removeOriginalFile,
  })
}

/**
 * Writes archived contents to a gzip file.
 *
 * @param {string} contents
 * @param {{ to: string, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 */
export const writeArchiveTo = async (contents, { to, createDirectories = false } = {}) => {
  if (createDirectories) {
    await ensureParentDirectory({ for: to })
  }

  await writeArchivedFile(to, contents)
}

/**
 * Reads text contents from a gzip archive.
 *
 * @param {{ from: string }} options
 * @returns {Promise<string>}
 *
 * @example
 * const html = await readArchiveFrom({
 *   from: '/tmp/report.html.gz',
 * })
 */
export const readArchiveFrom = async ({ from } = {}) => {
  return readArchivedFile(from)
}
