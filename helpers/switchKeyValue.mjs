/**
 * Swaps keys and values in a map.
 *
 * @template K, V
 * @param {Map<K, V>} map
 * @returns {Map<V, K>}
 *
 * @example
 * const colorByHex = invertMap(new Map([
 *   ['red', '#f00'],
 * ]))
 */
export const switchKeyValue = (map) => {
  return new Map(Array.from(map.entries()).map(([key, value]) => [value, key]))
}

/**
 * Swaps keys and values with a more descriptive name.
 *
 * @template K, V
 * @param {Map<K, V>} map
 * @returns {Map<V, K>}
 */
export const invertMap = (map) => {
  return switchKeyValue(map)
}
