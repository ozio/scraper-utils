import { describe, expect, test } from 'bun:test'

import { isValidPhone } from '../validators/isValidPhone.mjs'

describe('validators', () => {
  test('isValidPhone accepts 10-digit numbers without country code', () => {
    expect(isValidPhone(9265772603)).toBe(true)
  })

  test('isValidPhone accepts 11-digit numbers that start with 7 or 8', () => {
    expect(isValidPhone(79265772603)).toBe(true)
    expect(isValidPhone(89265772603)).toBe(true)
  })

  test('isValidPhone rejects empty, malformed, and repeated fake numbers', () => {
    expect(isValidPhone()).toBe(false)
    expect(isValidPhone(69265772603)).toBe(false)
    expect(isValidPhone('1111111111')).toBe(false)
  })
})
