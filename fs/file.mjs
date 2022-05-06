import { createReadStream, createWriteStream } from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream'
import fs from 'fs/promises'
import progress from 'progress-stream'

const pipe = promisify(pipeline)

export const writeFile = async (outputPath, contents) => {
  await fs.writeFile(outputPath, contents, 'utf-8')
}

export const readFile = async (inputPath) => {
  return fs.readFile(inputPath, 'utf-8')
}

export const removeFile = async (filePath) => {
  await fs.unlink(filePath)
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
