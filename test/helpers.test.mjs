import { Readable } from 'node:stream'
import { describe, expect, test } from 'bun:test'

import { matchFields } from '../helpers/areSame.mjs'
import { averageOf, calculateAverage } from '../helpers/calculateAverage.mjs'
import { calculateMedian, medianOf } from '../helpers/calculateMedian.mjs'
import { findURLsInString, urlsIn } from '../helpers/findURLsInString.mjs'
import { generateHashSHA256, hashOf } from '../helpers/generateHash.mjs'
import { getFixedDate, roundDateToHour } from '../helpers/getFixedDate.mjs'
import { compareStrings, hammingDistance } from '../helpers/hammingDistance.mjs'
import { objectToMap, mapFrom } from '../helpers/objectToMap.mjs'
import { pickRandom } from '../helpers/randomEl.mjs'
import { plural, pluralize } from '../helpers/plural.mjs'
import { shuffled } from '../helpers/shuffleArray.mjs'
import { hashStably, stableStringify } from '../helpers/stableStringify.mjs'
import { readStreamAsString } from '../helpers/streamToString.mjs'
import { invertMap, switchKeyValue } from '../helpers/switchKeyValue.mjs'
import { percentOf, toPercents } from '../helpers/toPercents.mjs'

describe('helpers', () => {
  test('calculateAverage returns the arithmetic mean', () => {
    expect(calculateAverage([10, 20, 30])).toBe(20)
    expect(averageOf([10, 20, 30])).toBe(20)
  })

  test('calculateMedian handles odd, even, and empty lists', () => {
    expect(calculateMedian([5, 1, 9])).toBe(5)
    expect(calculateMedian([10, 2, 8, 4])).toBe(6)
    expect(calculateMedian([])).toBe(0)
    expect(medianOf([5, 1, 9])).toBe(5)
  })

  test('findURLsInString extracts supported URLs without trailing punctuation', () => {
    const result = findURLsInString('Links: https://example.com/path?q=1, tg://resolve?domain=test.')

    expect(result).toEqual(['https://example.com/path?q=1', 'tg://resolve?domain=test'])
    expect(urlsIn('Open https://example.com now')).toEqual(['https://example.com'])
  })

  test('getFixedDate rounds down before half past and rounds up after it', () => {
    const roundedDown = getFixedDate(new Date(2026, 3, 17, 10, 29, 31, 500))
    const roundedUp = getFixedDate(new Date(2026, 3, 17, 10, 31, 31, 500))

    expect(roundedDown.getHours()).toBe(10)
    expect(roundedDown.getMinutes()).toBe(0)
    expect(roundedDown.getSeconds()).toBe(0)
    expect(roundedDown.getMilliseconds()).toBe(0)

    expect(roundedUp.getHours()).toBe(11)
    expect(roundedUp.getMinutes()).toBe(0)
    expect(roundedUp.getSeconds()).toBe(0)
    expect(roundedUp.getMilliseconds()).toBe(0)
    expect(roundDateToHour(new Date(2026, 3, 17, 10, 31, 31, 500)).getHours()).toBe(11)
  })

  test('hammingDistance returns null for different string lengths', () => {
    expect(hammingDistance('abc', 'ab')).toBeNull()
  })

  test('hammingDistance counts mismatches and respects early stop threshold', () => {
    expect(hammingDistance('karolin', 'kathrin')).toBe(3)
    expect(hammingDistance('abcd', 'wxyz', 1)).toBe(2)
    expect(compareStrings({ left: 'abcd', right: 'abcf' })).toBe(1)
  })

  test('objectToMap preserves enumerable entries', () => {
    expect([...objectToMap({ foo: 1, bar: 2 })]).toEqual([
      ['foo', 1],
      ['bar', 2],
    ])
    expect([...mapFrom({ foo: 1, bar: 2 })]).toEqual([
      ['foo', 1],
      ['bar', 2],
    ])
  })

  test('plural picks the correct template for russian declensions', () => {
    expect(plural(1, '% товар', '% товара', '% товаров')).toBe('1 товар')
    expect(plural(3, '% товар', '% товара', '% товаров')).toBe('3 товара')
    expect(plural(12, '% товар', '% товара', '% товаров')).toBe('12 товаров')
    expect(
      pluralize(3, {
        one: '% товар',
        two: '% товара',
        five: '% товаров',
      })
    ).toBe('3 товара')
  })

  test('switchKeyValue swaps map keys and values', () => {
    expect([
      ...switchKeyValue(
        new Map([
          ['red', '#f00'],
          ['green', '#0f0'],
        ])
      ),
    ]).toEqual([
      ['#f00', 'red'],
      ['#0f0', 'green'],
    ])

    expect([...invertMap(new Map([['blue', '#00f']]))]).toEqual([['#00f', 'blue']])
  })

  test('toPercents returns one decimal precision', () => {
    expect(toPercents(12, 1)).toBe(8.3)
    expect(toPercents(80, 20)).toBe(25)
    expect(percentOf(20, { in: 80 })).toBe(25)
  })

  test('matchFields compares records using named arguments', () => {
    expect(
      matchFields({
        fields: ['title'],
        left: { title: 'hello' },
        right: { title: 'hello' },
      })
    ).toBe(true)
  })

  test('hashOf matches dedicated hash helpers', () => {
    expect(hashOf('hello', { using: 'sha256' })).toBe(generateHashSHA256('hello'))
  })

  test('stableStringify and hashStably stay deterministic across object key order', () => {
    const left = { b: 2, a: 1, nested: { d: 4, c: 3 } }
    const right = { nested: { c: 3, d: 4 }, a: 1, b: 2 }

    expect(stableStringify(left)).toBe(stableStringify(right))
    expect(hashStably(left)).toBe(hashStably(right))
  })

  test('pickRandom and shuffled expose more readable random helpers', () => {
    const originalRandom = Math.random

    try {
      Math.random = () => 0

      expect(pickRandom({ from: ['first', 'second'] })).toBe('first')

      const input = [1, 2, 3]
      const output = shuffled(input)

      expect(output).toEqual([2, 3, 1])
      expect(input).toEqual([1, 2, 3])
    } finally {
      Math.random = originalRandom
    }
  })

  test('readStreamAsString reads a stream through named options', async () => {
    const text = await readStreamAsString({
      from: Readable.from(['hel', 'lo']),
    })

    expect(text).toBe('hello')
  })
})
