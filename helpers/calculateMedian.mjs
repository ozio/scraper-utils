/**
 * Calculates the median with a shorter, more readable call shape.
 *
 * @param {number[]} values
 * @returns {number}
 * @style target
 */
export const medianOf = (values) => {
  if (values.length === 0) return 0

  values.sort((a, b) => a - b)

  const half = Math.floor(values.length / 2)

  if (values.length % 2) return values[half]

  return (values[half - 1] + values[half]) / 2
}

/**
 * Calculates the median value.
 *
 * The input array is sorted in place before the median is picked.
 *
 * @param {number[]} values
 * @returns {number}
 *
 * @example
 * const median = medianOf([1200, 1500, 1800])
 * @style legacy
 */
export const calculateMedian = (values) => medianOf(values)
