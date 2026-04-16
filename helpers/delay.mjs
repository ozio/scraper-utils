/**
 * Resolves after the given amount of milliseconds.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
export const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Waits for the given amount of milliseconds.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 *
 * @example
 * await waitFor(250)
 */
export const waitFor = (ms) => {
  return delay(ms)
}
