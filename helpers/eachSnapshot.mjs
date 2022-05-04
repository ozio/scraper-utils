import fs from 'fs/promises'
import { readArchivedFile } from '../fs/gzip.mjs'

const PROGRESS_INTERVAL = 2000

export const eachSnapshot = async ({
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

  onProgress && onProgress({
    total,
    current: i,
    left: total - i,
  })

  const interval = onProgress ? setInterval(() => {
    onProgress({
      total,
      current: i,
      left: total - i,
    })
  }, progressInterval) : null

  for (; i < total; i++) {
    const filename = list[i]

    if (filename[0] === '.') continue

    const folder = snapshotPath
    const absolutePath = `${folder}/${filename}`
    const [innerId, timestamp] = filename.split('.').map(parseFloat)

    let html = ''

    if (shouldReadFile) {
      if (filename.endsWith('.gz')) {
        html = await readArchivedFile(absolutePath)
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

  onProgress && onProgress({
    total,
    current: i,
    left: total - i,
  })

  clearInterval(interval)
}
