/**
 * Converts an object into a map with a shorter, more natural name.
 *
 * @template T
 * @param {Record<string, T>} obj
 * @returns {Map<string, T>}
 * @style target
 */
export const mapFrom = (obj) => new Map(Object.entries(obj))

/**
 * Converts an object into a map of its enumerable entries.
 *
 * @template T
 * @param {Record<string, T>} obj
 * @returns {Map<string, T>}
 *
 * @example
 * const map = mapFrom({ foo: 1, bar: 2 })
 * @style legacy
 */
export const objectToMap = (obj) => mapFrom(obj)
