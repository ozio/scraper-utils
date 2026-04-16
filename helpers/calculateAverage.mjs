/**
 * Calculates the arithmetic mean of numeric values.
 *
 * @param {number[]} values
 * @returns {number}
 *
 * @example
 * const average = averageOf([10, 20, 30])
 */
export const calculateAverage = (values) => {
  let sum = 0

  for (let i = 0; i < values.length; i++) {
    sum += values[i]
  }

  return sum / values.length
}

/**
 * Calculates the arithmetic mean with a more conversational name.
 *
 * @param {number[]} values
 * @returns {number}
 */
export const averageOf = (values) => {
  return calculateAverage(values)
}
