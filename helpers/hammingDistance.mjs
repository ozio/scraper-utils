/**
 * Compares two strings and returns their Hamming distance.
 *
 * Stops early once the distance becomes greater than `maxDistance`.
 *
 * @param {{ left?: string, right?: string, maxDistance?: number }} [options]
 * @returns {number | null}
 * @style target
 */
export const compareStrings = ({ left = '', right = '', maxDistance = left.length } = {}) => {
  if (left.length !== right.length) {
    return null
  }

  let dist = 0

  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      dist += 1

      if (dist > maxDistance) {
        return dist
      }
    }
  }

  return dist
}

/**
 * Calculates the Hamming distance between strings of the same length.
 *
 * @param {string} [str1='']
 * @param {string} [str2='']
 * @param {number} [maxDistance=str1.length]
 * @returns {number | null}
 * @style legacy
 */
export const hammingDistance = (str1 = '', str2 = '', maxDistance = str1.length) =>
  compareStrings({ left: str1, right: str2, maxDistance })
