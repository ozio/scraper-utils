import { EventEmitter } from 'node:events'
import { readFile, rm } from 'node:fs/promises'
import { Readable } from 'node:stream'
import https from 'https'

import { afterEach, describe, expect, test } from 'bun:test'

import { downloadTemporaryFile } from '../network/download.mjs'
import { colorHash, colorizeByHash } from '../printers/colorHash.mjs'
import { printPriceDiff, printPriceTable } from '../printers/printPriceTable.mjs'

describe('style additions', () => {
  let createdPath

  afterEach(async () => {
    if (createdPath) {
      await rm(createdPath, { force: true })
      createdPath = undefined
    }
  })

  test('downloadTemporaryFile writes a temp file through the target API', async () => {
    const originalGet = https.get

    try {
      https.get = (url, options, callback) => {
        const request = new EventEmitter()
        request.destroy = () => {}

        const response = Readable.from(['hello'])
        response.statusCode = 200
        response.headers = { 'content-length': '5' }

        queueMicrotask(() => callback(response))

        request.on = EventEmitter.prototype.on

        return request
      }

      const result = await downloadTemporaryFile({
        from: 'https://example.com/file.txt',
      })

      createdPath = result.localPath

      expect(result.statusCode).toBe(200)
      expect(result.localPath.startsWith('/tmp/')).toBe(true)
      expect(result.localPath.endsWith('.txt')).toBe(true)
      expect(await readFile(result.localPath, 'utf8')).toBe('hello')
    } finally {
      https.get = originalGet
    }
  })

  test('printPriceDiff is the target printer while printPriceTable remains a legacy wrapper', () => {
    const originalLog = console.log
    const logs = []
    const from = {
      priceDay1HIn: 1000,
      priceDay2HIn: 2000,
      priceNight1HIn: 3000,
      priceNightIn: 4000,
      priceAnal: 5000,
      priceMBR: 6000,
      priceOVR: 7000,
      priceDay1HOut: 8000,
      priceDay2HOut: 9000,
      priceNight1HOut: 10000,
      priceNightOut: 11000,
    }
    const to = {
      ...from,
      priceDay1HIn: 1500,
      priceNightOut: 9000,
    }

    try {
      console.log = (...args) => {
        logs.push(args.join(' '))
      }

      printPriceDiff({ from, to })
      const targetLogs = [...logs]

      logs.length = 0
      printPriceTable(from, to)

      expect(targetLogs).toEqual(logs)
      expect(targetLogs.length).toBeGreaterThan(0)
    } finally {
      console.log = originalLog
    }
  })

  test('colorizeByHash is the target printer while colorHash remains a legacy wrapper', () => {
    const targetOutput = colorizeByHash('hello')
    const legacyOutput = colorHash('hello')

    expect(targetOutput).toContain('hello')
    expect(legacyOutput).toBe(targetOutput)
  })
})
