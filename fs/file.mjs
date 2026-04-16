import { createReadStream, createWriteStream } from 'node:fs'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream'
import fs from 'node:fs/promises'
import progress from 'progress-stream'
import path from 'path'

const pipe = promisify(pipeline)

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
 */
export const ensureDirectory = async ({ at }) => {
  await makeDirectory(at)
}

/**
 * Ensures that the parent directory for a file path exists.
 *
 * @param {{ for: string }} options
 * @returns {Promise<void>}
 */
export const ensureParentDirectory = async ({ for: filePath }) => {
  await makeDirectory(path.dirname(path.resolve(filePath)))
}

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
 */
export const listFiles = async ({ in: dirPath }) => {
  return readDirectory(dirPath)
}

export const fileExists = async (filePath) => {
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
 */
export const fileExistsAt = async ({ at }) => {
  return fileExists(at)
}

export const writeFile = async (outputPath, contents) => {
  await fs.writeFile(outputPath, contents, 'utf-8')
}

/**
 * Writes file contents to a path.
 *
 * @param {string | NodeJS.ArrayBufferView} contents
 * @param {{ to: string, encoding?: BufferEncoding, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 *
 * @example
 * await writeFileTo('hello', {
 *   to: '/tmp/greeting.txt',
 *   createDirectories: true,
 * })
 */
export const writeFileTo = async (contents, { to, encoding = 'utf-8', createDirectories = false } = {}) => {
  if (createDirectories) {
    await ensureParentDirectory({ for: to })
  }

  await fs.writeFile(to, contents, encoding)
}

export const readFile = async (inputPath) => {
  return fs.readFile(inputPath, 'utf-8')
}

/**
 * Reads text contents from a file.
 *
 * @param {{ from: string, encoding?: BufferEncoding }} options
 * @returns {Promise<string>}
 *
 * @example
 * const contents = await readFileFrom({
 *   from: '/tmp/greeting.txt',
 * })
 */
export const readFileFrom = async ({ from, encoding = 'utf-8' } = {}) => {
  return fs.readFile(from, encoding)
}

export const copyFile = async (inputPath, outputPath, { onProgress } = {}) => {
  if (onProgress) {
    const { size } = await fs.stat(inputPath)
    const source = createReadStream(inputPath)
    const destination = createWriteStream(outputPath)

    const str = progress(
      {
        length: size,
        time: 100,
      },
      onProgress
    )

    await pipe(source, str, destination)
  } else {
    await fs.copyFile(inputPath, outputPath)
  }
}

/**
 * Copies a file into a destination path.
 *
 * @param {{ from: string, to: string, onProgress?: Function, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 */
export const copyFileTo = async ({ from, to, onProgress, createDirectories = false } = {}) => {
  if (createDirectories) {
    await ensureParentDirectory({ for: to })
  }

  await copyFile(from, to, { onProgress })
}

export const moveFile = async (inputPath, outputPath, { onProgress } = {}) => {
  await copyFile(inputPath, outputPath, { onProgress })
  await removeFile(inputPath)
}

/**
 * Moves a file into a destination path.
 *
 * @param {{ from: string, to: string, onProgress?: Function, createDirectories?: boolean }} options
 * @returns {Promise<void>}
 */
export const moveFileTo = async ({ from, to, onProgress, createDirectories = false } = {}) => {
  if (createDirectories) {
    await ensureParentDirectory({ for: to })
  }

  await moveFile(from, to, { onProgress })
}

export const removeFile = async (filePath, throwIfNotExist) => {
  if (throwIfNotExist) {
    await fs.stat(filePath)
  }

  try {
    await fs.unlink(filePath)
  } catch (e) {}
}

/**
 * Removes a file by path.
 *
 * @param {{ at: string, throwIfNotExist?: boolean }} options
 * @returns {Promise<void>}
 */
export const removeFileAt = async ({ at, throwIfNotExist = false } = {}) => {
  await removeFile(at, throwIfNotExist)
}

export const removeDirectory = async (directoryPath) => {
  await fs.rm(directoryPath, {
    force: true,
    recursive: true,
  })
}

/**
 * Removes a directory recursively.
 *
 * @param {{ at: string }} options
 * @returns {Promise<void>}
 */
export const removeDirectoryAt = async ({ at }) => {
  await removeDirectory(at)
}

export const fileSize = async (filePath) => {
  const { size } = await fs.stat(filePath)
  return size
}

/**
 * Reads the size of a file in bytes.
 *
 * @param {{ at: string }} options
 * @returns {Promise<number>}
 */
export const fileSizeAt = async ({ at }) => {
  return fileSize(at)
}
