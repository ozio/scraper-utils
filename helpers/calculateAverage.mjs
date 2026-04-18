/**
 * Calculates the arithmetic mean with a more conversational name.
 *
 * @param {number[]} values
 * @returns {number}
 * @style target
 */
export const averageOf = (values) => {
  let sum = 0

  for (let i = 0; i < values.length; i++) {
    sum += values[i]
  }

  return sum / values.length
}

/**
 * Calculates the arithmetic mean of numeric values.
 *
 * @param {number[]} values
 * @returns {number}
 *
 * @example
 * const average = averageOf([10, 20, 30])
 * @style legacy
 */
export const calculateAverage = (values) => averageOf(values)
