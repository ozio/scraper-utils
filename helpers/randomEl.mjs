/**
 * Returns a random element from an array.
 *
 * @template T
 * @param {T[]} arr
 * @returns {T | undefined}
 */
export const randomEl = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Picks a random element using named options.
 *
 * @template T
 * @param {{ from: T[] }} options
 * @returns {T | undefined}
 *
 * @example
 * const winner = pickRandom({
 *   from: ['a', 'b', 'c'],
 * })
 */
export const pickRandom = ({ from }) => {
  return randomEl(from)
}
