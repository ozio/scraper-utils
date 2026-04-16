/**
 * Shuffles an array in place.
 *
 * @template T
 * @param {T[]} array
 * @returns {void}
 */
export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Returns a shuffled copy of an array.
 *
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 *
 * @example
 * const randomized = shuffled([1, 2, 3])
 */
export const shuffled = (array) => {
  const copy = [...array]
  shuffleArray(copy)
  return copy
}
