import { argv, stdout } from 'node:process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { areSame } from '../helpers/areSame.mjs'
import { beep, ringBell } from '../helpers/beep.mjs'
import { eachSnapshot } from '../helpers/eachSnapshot.mjs'
import { emojiHash, emojiHashOf } from '../helpers/emojiHash.mjs'
import { flag, hasFlag, readFlag } from '../helpers/flag.mjs'
import { getYearByICId, getYearById, getYearByRDId, yearForId } from '../helpers/getYearById.mjs'
import { guessPrice, pricesIn } from '../helpers/guessPrice.mjs'
import { resolveProxy } from '../helpers/prepareProxy.mjs'
import { REGEX_INSIDE_ROUND_BRACKETS, REGEX_NON_NUMBERS } from '../helpers/regex.mjs'
import { writeArchive } from '../fs/gzip.mjs'
import { ensureDirectory, writeFile } from '../fs/file.mjs'

describe('helper units', () => {
  const originalArgv = [...argv]
  let originalWrite
  let tempPath

  beforeEach(async () => {
    argv.splice(0, argv.length, ...originalArgv)
    originalWrite = stdout.write
    tempPath = await mkdtemp(path.join(os.tmpdir(), 'scraper-utils-helper-units-'))
  })

  afterEach(async () => {
    argv.splice(0, argv.length, ...originalArgv)
    stdout.write = originalWrite

    if (tempPath) {
      await rm(tempPath, { force: true, recursive: true })
    }
  })

  test('areSame handles direct matches and nested area/city fallbacks', () => {
    expect(
      areSame(
        ['areaTitle', 'cityTitle'],
        {
          areaTitle: null,
          cityTitle: null,
          area: { connectOrCreate: { create: { title: 'Center' } } },
          city: { connectOrCreate: { create: { title: 'Moscow' } } },
        },
        {
          areaTitle: 'Center',
          cityTitle: 'Moscow',
        }
      )
    ).toBe(true)

    expect(
      areSame(
        ['cityTitle'],
        {
          cityTitle: null,
          city: { connectOrCreate: { create: { title: 'Moscow' } } },
        },
        {
          cityTitle: 'Saint Petersburg',
        }
      )
    ).toBe(false)
  })

  test('beep helpers write the terminal bell character', () => {
    const writes = []

    stdout.write = (chunk) => {
      writes.push(chunk)
      return true
    }

    expect(beep()).toBe(true)
    expect(ringBell()).toBe(true)
    expect(writes).toEqual(['\u0007', '\u0007'])
  })

  test('flag helpers read bare flags and key-value flags from argv', () => {
    argv.splice(2, argv.length, '--proxy=10.0.0.1:9000', '--verbose', '--flag-with-empty=')

    expect(flag('--proxy')).toBe('10.0.0.1:9000')
    expect(readFlag({ named: '--verbose' })).toBe(true)
    expect(hasFlag('--missing')).toBe(false)
    expect(flag('--flag-with-empty')).toBe(true)
  })

  test('resolveProxy respects --no-proxy, explicit proxy flags, and fallbacks', () => {
    argv.splice(2, argv.length, '--proxy=10.0.0.1:9000')
    expect(resolveProxy()).toBe('10.0.0.1:9000')

    argv.splice(2, argv.length, '--proxy=10.0.0.1:9000', '--no-proxy')
    expect(resolveProxy()).toBeUndefined()

    argv.splice(2, argv.length)
    expect(resolveProxy({ fallback: '127.0.0.1:9999' })).toBe('127.0.0.1:9999')
  })

  test('year helpers map ids to the expected platform-specific year ranges', () => {
    expect(getYearById('rd', 1)).toBe(2022)
    expect(getYearByICId(1000)).toBe(2003)
    expect(getYearByICId(100000)).toBe(2010)
    expect(yearForId({ platform: 'ic', id: 470000 })).toBe(2022)
    expect(getYearByRDId(123)).toBe(2022)
  })

  test('regex helpers expose reusable matching patterns', () => {
    expect('abc123def'.replace(REGEX_NON_NUMBERS, '')).toBe('123')
    expect('hello (world) and (friends)'.match(REGEX_INSIDE_ROUND_BRACKETS)).toEqual(['world', 'friends'])
  })

  test('emojiHash helpers stay deterministic for the same input', () => {
    expect(emojiHash('hello', 2)).toBe('🈳💽')
    expect(emojiHashOf('hello', { length: 2 })).toBe('🈳💽')
  })

  test('guessPrice extracts normalized tokens from free-form text', () => {
    expect(guessPrice('5000 заранее')).toEqual([
      {
        type: 'roubles',
        value: 5000,
        mod: 'warn before',
      },
    ])

    expect(pricesIn('до 3 часов')).toEqual([
      {
        type: 'hours',
        value: 3,
        mod: 'maximum',
      },
    ])

    expect(guessPrice('2 контакта')).toEqual([
      {
        type: 'contacts',
        value: 2,
      },
    ])

    expect(guessPrice('1-3 пальца')).toEqual([
      {
        type: 'fingers',
        value: [1, 3],
      },
    ])
  })

  test('eachSnapshot supports filters, progress notifications, and gz file reads', async () => {
    const snapshotPath = path.join(tempPath, 'snapshots')
    const progressCalls = []
    const seen = []

    await ensureDirectory({ at: snapshotPath })
    await writeFile('plain', {
      to: path.join(snapshotPath, '101.1000.html'),
    })
    await writeArchive('archived', {
      to: path.join(snapshotPath, '202.2000.gz'),
    })

    await eachSnapshot({
      snapshotPath,
      shouldReadFile: true,
      filter: (filename) => filename.endsWith('.gz'),
      onProgress: (payload) => {
        progressCalls.push(payload)
      },
      progressInterval: 5,
      callback: async (entry) => {
        seen.push(entry)
      },
    })

    expect(seen).toEqual([
      {
        innerId: 202,
        timestamp: 2000,
        html: 'archived',
        filename: '202.2000.gz',
        folder: snapshotPath,
      },
    ])
    expect(progressCalls[0]).toEqual({
      total: 1,
      current: 0,
      left: 1,
    })
    expect(progressCalls.at(-1)).toEqual({
      total: 1,
      current: 1,
      left: 0,
    })
  })
})
