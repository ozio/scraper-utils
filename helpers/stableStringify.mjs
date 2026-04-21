import { hashOf } from './generateHash.mjs'

/**
 * Serializes a value with stable object key ordering.
 *
 * @param {unknown} value
 * @returns {string}
 *
 * @example
 * const json = stableStringify({
 *   b: 2,
 *   a: 1,
 * })
 * @style target
 */
export const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`
  }

  return JSON.stringify(value)
}

/**
 * Generates a hash from a stable serialized representation of a value.
 *
 * @param {unknown} value
 * @param {{ using?: string }} [options]
 * @returns {string}
 *
 * @example
 * const digest = hashStably({
 *   slug: 'ginza',
 *   status: 1,
 * })
 * @style target
 */
export const hashStably = (value, { using = 'sha256' } = {}) => hashOf(stableStringify(value), { using })
