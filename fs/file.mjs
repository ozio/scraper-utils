import { createReadStream, createWriteStream } from 'node:fs'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream'
import fs from 'node:fs/promises'
import progress from 'progress-stream'
import path from 'path'

const pipe = promisify(pipeline)

/**
 * @style legacy
 */
export const makeDirectory = async (fullPath) => {
  const parts = fullPath.split('/')
  let currentPath = ''

  for (let i = 0; i < parts.length; i++) {
    if (i === 0) continue

    currentPath += `/${parts[i]}`

    try {
      await fs.access(currentPath)
    } catch (e) {
      await fs.mkdir(currentPath)
    }
  }
}

/**
 * Ensures that a directory exists.
 *
 * @param {{ at: string }} options
 * @returns {Promise<void>}
 * @style target
 */
export const ensureDirectory = async ({ at }) => {
  await makeDirectory(at)
}

/**
 * Ensures that the parent directory for a file path exists.
 *
 * @param {{ for: string }} options
 * @returns {Promise<void>}
 * @style target
 */
export const ensureParentDirectory = async ({ for: filePath }) => {
  await makeDirectory(path.dirname(path.resolve(filePath)))
}

/**
 * @style legacy
 */
export const readDirectory = async (dirPath) => {
  const list = await fs.readdir(dirPath)
  const absPath = path.resolve(dirPath)

  return list.map((item) => `${absPath}/${item}`)
}

/**
 * Lists absolute file paths inside a directory.
 *
 * @param {{ in: string }} options
 * @returns {Promise<string[]>}
 *
 * @example
 * const files = await listFiles({
 *   in: '/tmp/screenshots',
 * })
 * @style target
 */
export const listFiles = async ({ in: dirPath }) => {
  return readDirectory(dirPath)
}

/**
 * Checks whether a file exists at a path.
 *
 * @param {string} filePath
 * @returns {Promise<boolean>}
 *
 * @example
 * const exists = await fileExistsAt('/tmp/greeting.txt')
 * @style target
 */
export const fileExistsAt = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Checks whether a file exists.
 *
 * @param {{ at: string }} options
 * @returns {Promise<boolean>}
 * @style legacy
 */
export const fileExists = async ({ at }) => fileExistsAt(at)

/**
 * Writes file contents to a path.
 *
 * @param {string | NodeJS.ArrayBufferView} contents
 * @param {{ to: string, encoding?: BufferEncoding, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 *
 * @example
 * await writeFile('hello', {
 *   to: '/tmp/greeting.txt',
 *   createDirectories: true,
 * })
 * @style target
 */
export const writeFile = async (contents, { to, encoding = 'utf-8', createDirectories = false } = {}) => {
  if (createDirectories) {
    await ensureParentDirectory({ for: to })
  }

  await fs.writeFile(to, contents, encoding)
}

/**
 * Reads text contents from a file.
 *
 * @param {{ from: string, encoding?: BufferEncoding }} options
 * @returns {Promise<string>}
 *
 * @example
 * const contents = await readFile({
 *   from: '/tmp/greeting.txt',
 * })
 * @style target
 */
export const readFile = async ({ from, encoding = 'utf-8' } = {}) => {
  return fs.readFile(from, encoding)
}

/**
 * Copies a file between paths.
 *
 * @param {{ from: string, to: string, onProgress?: Function, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 *
 * @example
 * await copyFile({
 *   from: '/tmp/source.txt',
 *   to: '/tmp/copy.txt',
 *   createDirectories: true,
 * })
 * @style target
 */
export const copyFile = async ({ from, to, onProgress, createDirectories = false } = {}) => {
  if (createDirectories) {
    await ensureParentDirectory({ for: to })
  }

  if (onProgress) {
    const { size } = await fs.stat(from)
    const source = createReadStream(from)
    const destination = createWriteStream(to)

    const str = progress(
      {
        length: size,
        time: 100,
      },
      onProgress
    )

    await pipe(source, str, destination)
  } else {
    await fs.copyFile(from, to)
  }
}

/**
 * Moves a file into a destination path.
 *
 * @param {{ from: string, to: string, onProgress?: Function, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 * @style target
 */
export const moveFile = async ({ from, to, onProgress, createDirectories = false } = {}) => {
  if (createDirectories) {
    await ensureParentDirectory({ for: to })
  }

  await copyFile({
    from,
    to,
    onProgress,
  })
  await removeFile({ at: from })
}

/**
 * Removes a file by path.
 *
 * @param {{ at: string, throwIfNotExist?: boolean }} options
 * @returns {Promise<void>}
 * @style target
 */
export const removeFile = async ({ at, throwIfNotExist = false } = {}) => {
  if (throwIfNotExist) {
    await fs.stat(at)
  }

  try {
    await fs.unlink(at)
  } catch (e) {}
}

/**
 * Removes a directory recursively.
 *
 * @param {{ at: string }} options
 * @returns {Promise<void>}
 * @style target
 */
export const removeDirectory = async ({ at }) => {
  await fs.rm(at, {
    force: true,
    recursive: true,
  })
}

/**
 * Reads the size of a file in bytes.
 *
 * @param {{ at: string }} options
 * @returns {Promise<number>}
 * @style target
 */
export const fileSize = async ({ at }) => {
  const { size } = await fs.stat(at)
  return size
}
