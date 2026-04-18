import { once } from 'node:events'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { Image } from '../classes/Image.mjs'
import { Page } from '../classes/Page.mjs'
import { Queue } from '../classes/Queue.mjs'
import { Text } from '../classes/Text.mjs'
import { TimeLeft } from '../classes/TimeLeft.mjs'
import { Video } from '../classes/Video.mjs'

const createSolidPng = async ({ width, height, background }) => {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background,
    },
  })
    .png()
    .toBuffer()
}

const createBorderedPng = async () => {
  const pixels = []

  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      const isCenter = x > 0 && x < 4 && y > 0 && y < 4
      pixels.push(...(isCenter ? [0, 0, 0] : [255, 255, 255]))
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: {
      width: 5,
      height: 5,
      channels: 3,
    },
  })
    .png()
    .toBuffer()
}

describe('classes', () => {
  let tempPath

  beforeEach(async () => {
    tempPath = await mkdtemp(path.join(os.tmpdir(), 'scraper-utils-classes-'))
  })

  afterEach(async () => {
    if (tempPath) {
      await rm(tempPath, { force: true, recursive: true })
    }
  })

  test('Page parses html, keeps url metadata, and updates the document tree', () => {
    const page = new Page({
      url: 'https://example.com/one',
      html: '<main><h1>First</h1></main>',
      timestamp: 100,
    })

    expect(page.url.href).toBe('https://example.com/one')
    expect(page.timestamp).toBe(100)
    expect(page.root.querySelector('h1')?.text).toBe('First')

    page.update({
      url: 'https://example.com/two',
      html: '<main><h1>Second</h1><p>Updated</p></main>',
      timestamp: 200,
    })

    expect(page.url.href).toBe('https://example.com/two')
    expect(page.timestamp).toBe(200)
    expect(page.root.querySelector('p')?.text).toBe('Updated')
  })

  test('Page exposes data() as the target API and keeps getData() as a legacy wrapper', () => {
    const page = new Page({
      url: 'https://example.com',
      html: '<div></div>',
      timestamp: 1,
    })
    const warnings = []
    const originalWarn = console.warn

    try {
      console.warn = (message) => {
        warnings.push(message)
      }

      expect(page.data()).toEqual({})
      expect(page.getData()).toEqual({})
      expect(warnings).toEqual(['Warning: getData() method is empty'])
    } finally {
      console.warn = originalWarn
    }
  })

  test('Text exposes target hash()/similarity() helpers and preserves legacy wrappers', () => {
    const text = new Text('hello world')
    const firstHash = text.hash()
    const secondHash = text.hash()

    expect(firstHash).toBe(secondHash)
    expect(text.similarity('hello world')).toBe(1)
    expect(text.similarity('completely different')).toBeLessThan(1)
    expect(text.getHash()).toBe(firstHash)
    expect(text.compare('hello world')).toBe(1)
    expect(text.toString()).toBe('hello world')
  })

  test('TimeLeft keeps only the latest 100 records and computes target average/median projections', () => {
    const timeLeft = new TimeLeft()

    for (let index = 1; index <= 105; index += 1) {
      timeLeft.record(index)
    }

    expect(timeLeft.records).toHaveLength(100)
    expect(timeLeft.records[0]).toBe(6)
    expect(timeLeft.records.at(-1)).toBe(105)
    expect(timeLeft.averageFor({ itemsLeft: 2 })).toBe(111)
    expect(timeLeft.medianFor({ itemsLeft: 2 })).toBe(111)
    expect(timeLeft.getAverage(2)).toBe(111)
    expect(timeLeft.getMedian(2)).toBe(111)
  })

  test('Queue processes items and emits completion events', async () => {
    const processed = []
    const queue = new Queue({
      streams: 2,
      process: async (item) => {
        processed.push(item)
        return item * 10
      },
    })
    const finishPromise = once(queue, 'queue:finish')

    queue.addMany([1, 2, 3])

    const [payload] = await finishPromise

    expect(processed.sort()).toEqual([1, 2, 3])
    expect(payload).toEqual({
      errorsCount: 0,
      errorsLimit: Queue.DEFAULT_ERRORS_LIMIT,
    })
    expect(queue.queue.size).toBe(0)
  })

  test('Queue retries failed work and eventually becomes idle', async () => {
    const attempts = new Map()
    const queue = new Queue({
      streams: 1,
      maxRetries: 1,
      idleTimeoutMs: 5,
      process: async (item) => {
        const current = (attempts.get(item) || 0) + 1
        attempts.set(item, current)

        if (current === 1) {
          throw new Error('try again')
        }

        return `${item}:done`
      },
    })
    const retryPromise = once(queue, 'process:retry')
    const finishPromise = once(queue, 'queue:finish')
    const idlePromise = once(queue, 'queue:idle')

    queue.add('job')

    const [retryPayload] = await retryPromise
    const [finishPayload] = await finishPromise
    await idlePromise

    expect(retryPayload).toEqual({
      item: 'job',
      retryCount: 1,
    })
    expect(finishPayload.errorsCount).toBe(0)
    expect(attempts.get('job')).toBe(2)
    expect(queue.queue.size).toBe(0)
  })

  test('Queue stops once the errors limit is reached and reports remaining items', async () => {
    const queue = new Queue({
      streams: 1,
      errorsLimit: 1,
      process: async () => {
        throw new Error('boom')
      },
    })
    const errorsLimitPromise = once(queue, 'queue:errors-limit')
    const finishPromise = once(queue, 'queue:finish')

    queue.addMany(['first', 'second'])

    const [limitPayload] = await errorsLimitPromise
    const [finishPayload] = await finishPromise

    expect(limitPayload.items).toEqual(['second'])
    expect(limitPayload.errorsCount).toBe(1)
    expect(limitPayload.errorsLimit).toBe(1)
    expect(finishPayload.errorsCount).toBe(1)
    expect(queue.queue.has('second')).toBe(true)
  })

  test('Video exposes target factories and methods while preserving legacy wrappers', async () => {
    const video = Video.load({
      filePath: '/tmp/video.mp4',
      buffer: Buffer.from('hello'),
    })

    video.metadata = async () => ({
      format: { duration: '12.6' },
      streams: [{ codec_type: 'audio' }, { codec_type: 'video', width: 1920, height: 1080 }],
    })

    expect(await video.basicInfo()).toEqual({
      duration: 13,
      width: 1920,
      height: 1080,
    })
    expect(await video.hash()).toBe('5d41402abc4b2a76b9719d911017c592')
    expect(await video.hash()).toBe('5d41402abc4b2a76b9719d911017c592')
    expect(await video.getBasicInfo()).toEqual({
      duration: 13,
      width: 1920,
      height: 1080,
    })
    expect(await video.getHash()).toBe('5d41402abc4b2a76b9719d911017c592')
  })

  test('Image reads metadata from buffers and target load({ from }) paths', async () => {
    const buffer = await createSolidPng({
      width: 3,
      height: 3,
      background: { r: 255, g: 0, b: 0 },
    })
    const filePath = path.join(tempPath, 'red.png')

    await writeFile(filePath, buffer)

    const fromBuffer = new Image(buffer)
    const fromPath = Image.load({ from: filePath })

    expect((await fromBuffer.metadata()).width).toBe(3)
    expect((await fromPath.metadata()).height).toBe(3)
    expect((await fromPath.getMeta()).height).toBe(3)
  })

  test('Image exposes target image helpers and keeps legacy wrappers working', async () => {
    const bordered = new Image(await createBorderedPng())

    await bordered.metadata()
    await bordered.trim({ threshold: 1 })

    expect(await bordered.dimensions()).toEqual({
      width: 3,
      height: 3,
    })

    const red = new Image(
      await createSolidPng({
        width: 4,
        height: 2,
        background: { r: 255, g: 0, b: 0 },
      })
    )

    await red.metadata()

    expect(await red.averageColor()).toEqual({
      r: 255,
      g: 0,
      b: 0,
    })
    expect(await red.differenceHash({ complexity: 4 })).toBe('0')

    await red.makeSquare()

    expect(await red.dimensions()).toEqual({
      width: 2,
      height: 2,
    })
    expect(await red.aspectRatio()).toBe(1)
    expect(await red.getAverageColor()).toEqual({
      r: 255,
      g: 0,
      b: 0,
    })
    expect(await red.getDHash(4)).toBe('0')
    expect(await red.getRatio()).toBe(1)
  })
})
