import fs from 'fs/promises'
import { readArchive } from '../fs/gzip.mjs'

const PROGRESS_INTERVAL = 2000

const iterateSnapshots = async ({
  snapshotPath,
  callback,
  onProgress,
  filter,
  shouldReadFile = false,
  progressInterval = PROGRESS_INTERVAL,
}) => {
  let list = await fs.readdir(snapshotPath)

  if (filter) {
    list = list.filter(filter)
  }

  const total = list.length

  let i = 0

  onProgress &&
    onProgress({
      total,
      current: i,
      left: total - i,
    })

  const interval = onProgress
    ? setInterval(() => {
        onProgress({
          total,
          current: i,
          left: total - i,
        })
      }, progressInterval)
    : null

  for (; i < total; i += 1) {
    const filename = list[i]

    if (filename[0] === '.') continue

    const folder = snapshotPath
    const absolutePath = `${folder}/${filename}`
    const [innerId, timestamp] = filename.split('.').map(parseFloat)

    let html = ''

    if (shouldReadFile) {
      if (filename.endsWith('.gz')) {
        html = await readArchive({ from: absolutePath })
      } else {
        html = await fs.readFile(absolutePath, 'utf-8')
      }
    }

    await callback({
      innerId,
      timestamp,
      html,
      filename,
      folder,
    })
  }

  onProgress &&
    onProgress({
      total,
      current: i,
      left: total - i,
    })

  clearInterval(interval)
}

/**
 * Iterates through snapshot files in a directory.
 *
 * @param {{ in: string, callback: Function, onProgress?: Function, filter?: Function, shouldReadFile?: boolean, progressInterval?: number }} options
 * @returns {Promise<void>}
 * @style target
 */
export const forEachSnapshot = async ({ in: snapshotPath, ...options }) => {
  await iterateSnapshots({
    snapshotPath,
    ...options,
  })
}

/**
 * Iterates through snapshot files and reads their contents automatically.
 *
 * @param {{ in: string, callback: Function, onProgress?: Function, filter?: Function, progressInterval?: number }} options
 * @returns {Promise<void>}
 *
 * @example
 * await readEachSnapshot({
 *   in: './snapshots',
 *   callback: async ({ html }) => {
 *     console.log(html.length)
 *   },
 * })
 * @style target
 */
export const readEachSnapshot = async ({ in: snapshotPath, ...options }) => {
  await iterateSnapshots({
    snapshotPath,
    shouldReadFile: true,
    ...options,
  })
}

/**
 * Iterates through snapshot files in a directory.
 *
 * @param {{
 *   snapshotPath: string,
 *   callback: Function,
 *   onProgress?: Function,
 *   filter?: Function,
 *   shouldReadFile?: boolean,
 *   progressInterval?: number
 * }} options
 * @returns {Promise<void>}
 * @style legacy
 */
export const eachSnapshot = async ({ snapshotPath, ...options }) => {
  await forEachSnapshot({
    in: snapshotPath,
    ...options,
  })
}
