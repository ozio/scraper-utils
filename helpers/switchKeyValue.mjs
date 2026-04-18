/**
 * Swaps keys and values with a more descriptive name.
 *
 * @template K, V
 * @param {Map<K, V>} map
 * @returns {Map<V, K>}
 * @style target
 */
export const invertMap = (map) => new Map(Array.from(map.entries()).map(([key, value]) => [value, key]))

/**
 * Swaps keys and values in a map.
 *
 * @template K, V
 * @param {Map<K, V>} map
 * @returns {Map<V, K>}
 *
 * @example
 * const colorByHex = invertMap(new Map([['red', '#f00']]))
 * @style legacy
 */
export const switchKeyValue = (map) => invertMap(map)
