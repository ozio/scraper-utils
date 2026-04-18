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
 * @style target
 */
export const pickRandom = ({ from }) => from[Math.floor(Math.random() * from.length)]

/**
 * Returns a random element from an array.
 *
 * @template T
 * @param {T[]} arr
 * @returns {T | undefined}
 * @style legacy
 */
export const randomEl = (arr) => pickRandom({ from: arr })
