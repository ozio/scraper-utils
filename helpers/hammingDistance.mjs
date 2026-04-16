/**
 * Calculates the Hamming distance between strings of the same length.
 *
 * Stops early once the distance becomes greater than `maxDistance`.
 *
 * @param {string} [str1='']
 * @param {string} [str2='']
 * @param {number} [maxDistance=str1.length]
 * @returns {number | null}
 */
export const hammingDistance = (str1 = '', str2 = '', maxDistance = str1.length) => {
  if (str1.length !== str2.length) {
    return null
  }

  let dist = 0

  for (let i = 0; i < str1.length; i += 1) {
    if (str1[i] !== str2[i]) {
      dist += 1

      if (dist > maxDistance) {
        return dist
      }
    }
  }

  return dist
}

/**
 * Compares two strings and returns their Hamming distance.
 *
 * @param {{ left?: string, right?: string, maxDistance?: number }} [options]
 * @returns {number | null}
 */
export const compareStrings = ({ left = '', right = '', maxDistance = left.length } = {}) => {
  return hammingDistance(left, right, maxDistance)
}
