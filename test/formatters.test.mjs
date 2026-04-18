import { describe, expect, test } from 'bun:test'

import { formatPhone } from '../formatters/formatPhone.mjs'
import { formatDuration, formatTimeRange } from '../formatters/formatTimeRange.mjs'

describe('formatters', () => {
  test('formatPhone formats numbers and strings into +7 notation', () => {
    expect(formatPhone(9265772603)).toBe('+7 (926) 577-26-03')
    expect(formatPhone('9265772603')).toBe('+7 (926) 577-26-03')
  })

  test('formatTimeRange formats long ranges with milliseconds when requested', () => {
    expect(formatTimeRange(3723004, true)).toBe('1ч 2м 3с 4мс')
    expect(formatDuration(3723004, { includeMilliseconds: true })).toBe('1ч 2м 3с 4мс')
  })

  test('formatTimeRange keeps milliseconds when that is the only unit', () => {
    expect(formatTimeRange(500)).toBe('500мс')
  })

  test('formatTimeRange omits milliseconds when larger units are enough', () => {
    expect(formatTimeRange(60000)).toBe('1м')
  })
})
