/**
 * Waits for the given amount of milliseconds.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 *
 * @example
 * await waitFor(250)
 * @style target
 */
export const waitFor = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Resolves after the given amount of milliseconds.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 * @style legacy
 */
export const delay = (ms) => waitFor(ms)
