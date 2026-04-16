const SECOND = 1000

/**
 * Sleeps for the given amount of milliseconds.
 *
 * Uses a long-timer loop for sleeps longer than one second.
 *
 * @param {number} [ms=100]
 * @returns {Promise<void>}
 */
export const sleep = (ms = 100) =>
  new Promise((resolve) => {
    if (ms < SECOND) {
      setTimeout(resolve, ms)
      return
    }

    const endTimestamp = new Date().getTime() + ms

    const handler = () => {
      const currentTimestamp = new Date().getTime()

      if (currentTimestamp >= endTimestamp) {
        resolve()
      } else {
        setTimeout(handler, SECOND)
      }
    }

    setTimeout(handler, SECOND)
  })

/**
 * Sleeps for the given amount of milliseconds with a more explicit name.
 *
 * @param {number} [ms=100]
 * @returns {Promise<void>}
 */
export const sleepFor = (ms = 100) => sleep(ms)
