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

export const readDirectory = async (dirPath) => {
  const list = await fs.readdir(dirPath)
  const absPath = path.resolve(dirPath)

  return list.map(item => `${absPath}/${item}`)
}

export const fileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch (e) {
    return false
  }
}

export const writeFile = async (outputPath, contents) => {
  await fs.writeFile(outputPath, contents, 'utf-8')
}

export const readFile = async (inputPath) => {
  return fs.readFile(inputPath, 'utf-8')
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
      onProgress,
    )

    await pipe(source, str, destination)
  } else {
    await fs.copyFile(inputPath, outputPath)
  }
}

export const moveFile = async (inputPath, outputPath, { onProgress } = {}) => {
  await copyFile(inputPath, outputPath, { onProgress })
  await removeFile(inputPath)
}

export const removeFile = async (filePath, throwIfNotExist) => {
  if (throwIfNotExist) {
    await fs.stat(filePath)
  }

  try {
    await fs.unlink(filePath)
  } catch (e) {}
}

export const removeDirectory = async (directoryPath) => {
  await fs.rm(directoryPath, {
    force: true,
    recursive: true,
  })
}

export const fileSize = async (filePath) => {
  const { size } = await fs.stat(filePath)
  return size
}
