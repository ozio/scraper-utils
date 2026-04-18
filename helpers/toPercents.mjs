/**
 * Converts a partial value into percents using named options.
 *
 * @param {number} partial
 * @param {{ in: number }} options
 * @returns {number}
 * @style target
 */
export const percentOf = (partial, { in: all }) => Math.round((partial / all) * 1000) / 10

/**
 * Converts a partial value into percents with one decimal place precision.
 *
 * @param {number} all
 * @param {number} partial
 * @returns {number}
 *
 * @example
 * const ratio = percentOf(20, {
 *   in: 80,
 * })
 * @style legacy
 */
export const toPercents = (all, partial) => percentOf(partial, { in: all })
