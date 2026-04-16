import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, realpath, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  copyFileTo,
  ensureDirectory,
  fileExistsAt,
  fileSizeAt,
  listFiles,
  moveFileTo,
  readFileFrom,
  removeDirectoryAt,
  removeFileAt,
  writeFileTo,
} from '../fs/file.mjs'
import { archiveFileFrom, readArchiveFrom, unarchiveFileFrom, writeArchiveTo } from '../fs/gzip.mjs'
import { forEachSnapshot, readEachSnapshot } from '../helpers/eachSnapshot.mjs'
import { readCommandOutput, runCommand } from '../helpers/execAsync.mjs'

describe('expressive api', () => {
  let tempPath

  beforeEach(async () => {
    tempPath = await mkdtemp(path.join(os.tmpdir(), 'scraper-utils-'))
  })

  afterEach(async () => {
    if (tempPath) {
      await rm(tempPath, { force: true, recursive: true })
    }
  })

  test('writeFileTo and readFileFrom support named paths and directory creation', async () => {
    const filePath = path.join(tempPath, 'letters', 'greeting.txt')

    await writeFileTo('hello', {
      to: filePath,
      createDirectories: true,
    })

    expect(await readFileFrom({ from: filePath })).toBe('hello')
    expect(await fileExistsAt({ at: filePath })).toBe(true)
    expect(await fileSizeAt({ at: filePath })).toBe(5)
  })

  test('copyFileTo and moveFileTo keep call sites readable', async () => {
    const sourcePath = path.join(tempPath, 'source.txt')
    const copyPath = path.join(tempPath, 'copies', 'source.txt')
    const movedPath = path.join(tempPath, 'moved', 'source.txt')

    await writeFileTo('robot', { to: sourcePath })
    await copyFileTo({
      from: sourcePath,
      to: copyPath,
      createDirectories: true,
    })
    await moveFileTo({
      from: copyPath,
      to: movedPath,
      createDirectories: true,
    })

    expect(await readFileFrom({ from: sourcePath })).toBe('robot')
    expect(await fileExistsAt({ at: copyPath })).toBe(false)
    expect(await readFileFrom({ from: movedPath })).toBe('robot')
  })

  test('ensureDirectory, listFiles, removeFileAt, and removeDirectoryAt compose cleanly', async () => {
    const directoryPath = path.join(tempPath, 'notes')
    const alphaPath = path.join(directoryPath, 'alpha.txt')
    const betaPath = path.join(directoryPath, 'beta.txt')

    await ensureDirectory({ at: directoryPath })
    await writeFileTo('a', { to: alphaPath })
    await writeFileTo('b', { to: betaPath })

    expect((await listFiles({ in: directoryPath })).sort()).toEqual([alphaPath, betaPath])

    await removeFileAt({ at: alphaPath })
    expect(await fileExistsAt({ at: alphaPath })).toBe(false)

    await removeDirectoryAt({ at: directoryPath })
    expect(await fileExistsAt({ at: betaPath })).toBe(false)
  })

  test('archive wrappers keep text workflows pleasant', async () => {
    const sourcePath = path.join(tempPath, 'plain.txt')
    const archivePath = path.join(tempPath, 'archives', 'plain.txt.gz')
    const restoredPath = path.join(tempPath, 'restored', 'plain.txt')

    await writeFileTo('compressed hello', { to: sourcePath })
    await archiveFileFrom({
      from: sourcePath,
      to: archivePath,
      createDirectories: true,
    })
    await unarchiveFileFrom({
      from: archivePath,
      to: restoredPath,
      createDirectories: true,
    })

    expect(await readFileFrom({ from: restoredPath })).toBe('compressed hello')
  })

  test('writeArchiveTo and readArchiveFrom work as a direct text pair', async () => {
    const archivePath = path.join(tempPath, 'archives', 'message.txt.gz')

    await writeArchiveTo('hello archive', {
      to: archivePath,
      createDirectories: true,
    })

    expect(await readArchiveFrom({ from: archivePath })).toBe('hello archive')
  })

  test('runCommand and readCommandOutput support named working directories', async () => {
    const { stdout } = await runCommand('pwd', { in: tempPath })
    const resolvedTempPath = await realpath(tempPath)

    expect(stdout.trim()).toBe(resolvedTempPath)
    expect((await readCommandOutput('printf hello', { in: tempPath })).trim()).toBe('hello')
  })

  test('forEachSnapshot and readEachSnapshot wrap snapshot iteration nicely', async () => {
    const snapshotPath = path.join(tempPath, 'snapshots')
    const seen = []
    const read = []

    await ensureDirectory({ at: snapshotPath })
    await writeFileTo('first', {
      to: path.join(snapshotPath, '101.1000.html'),
    })
    await writeFileTo('second', {
      to: path.join(snapshotPath, '202.2000.html'),
    })
    await writeFileTo('hidden', {
      to: path.join(snapshotPath, '.ignore-me'),
    })

    await forEachSnapshot({
      in: snapshotPath,
      callback: async ({ innerId, timestamp, filename }) => {
        seen.push({ innerId, timestamp, filename })
      },
    })

    await readEachSnapshot({
      in: snapshotPath,
      callback: async ({ filename, html }) => {
        read.push({ filename, html })
      },
    })

    expect(seen).toHaveLength(2)
    expect(seen.map(({ filename }) => filename).sort()).toEqual(['101.1000.html', '202.2000.html'])
    expect(read.map(({ html }) => html).sort()).toEqual(['first', 'second'])
  })
})
