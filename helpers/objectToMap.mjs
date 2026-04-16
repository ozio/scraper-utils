/**
 * Converts an object into a map of its enumerable entries.
 *
 * @template T
 * @param {Record<string, T>} obj
 * @returns {Map<string, T>}
 *
 * @example
 * const map = mapFrom({ foo: 1, bar: 2 })
 */
export const objectToMap = (obj) => {
  return new Map(Object.entries(obj))
}

/**
 * Converts an object into a map with a shorter, more natural name.
 *
 * @template T
 * @param {Record<string, T>} obj
 * @returns {Map<string, T>}
 */
export const mapFrom = (obj) => {
  return objectToMap(obj)
}
