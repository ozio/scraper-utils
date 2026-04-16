import { describe, expect, test } from 'bun:test'

describe('package entrypoints', () => {
  test('package root re-exports the public API', async () => {
    const pkg = await import('@mr_ozio/scraper-utils')

    expect(typeof pkg.writeFileTo).toBe('function')
    expect(typeof pkg.readPage).toBe('function')
    expect(typeof pkg.Queue).toBe('function')
    expect(pkg.REGEX_NON_NUMBERS).toBeInstanceOf(RegExp)
  })

  test('extensionless subpath imports resolve through package exports', async () => {
    const fsModule = await import('@mr_ozio/scraper-utils/fs/file')
    const helperModule = await import('@mr_ozio/scraper-utils/helpers/calculateAverage')
    const classModule = await import('@mr_ozio/scraper-utils/classes/Queue')

    expect(typeof fsModule.writeFileTo).toBe('function')
    expect(helperModule.averageOf([10, 20, 30])).toBe(20)
    expect(typeof classModule.Queue).toBe('function')
  })
})
