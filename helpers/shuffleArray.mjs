/**
 * Returns a shuffled copy of an array.
 *
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 *
 * @example
 * const randomized = shuffled([1, 2, 3])
 * @style target
 */
export const shuffled = (array) => {
  const copy = [...array]

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

/**
 * Shuffles an array in place.
 *
 * @template T
 * @param {T[]} array
 * @returns {void}
 * @style legacy
 */
export const shuffleArray = (array) => {
  const randomized = shuffled(array)

  for (let i = 0; i < randomized.length; i += 1) {
    array[i] = randomized[i]
  }
}
