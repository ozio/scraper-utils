import fs from 'fs/promises'

const FIKA_FROM = 4 // *:00
const FIKA_TO = 12 // *:05

const check = async (fromMinute, toMinute) => {
  if (typeof fromMinute === 'number' && typeof toMinute === 'number') {
    const currentMinute = new Date().getMinutes()

    return currentMinute < fromMinute || currentMinute >= toMinute
  }

  if (typeof fromMinute === 'string') {
    try {
      await fs.stat(fromMinute)
      return false
    } catch (e) {
      return true
    }
  }
}

/**
 * Waits until the blocked minute range has passed.
 *
 * When the first argument is a string, it waits until that file appears.
 *
 * @param {number | string} [fromMinute=FIKA_FROM]
 * @param {number} [toMinute=FIKA_TO]
 * @returns {Promise<void>}
 */
export const fikaCheck = async (fromMinute = FIKA_FROM, toMinute = FIKA_TO) => {
  if (await check(fromMinute, toMinute)) {
    return Promise.resolve()
  }

  console.log('Мужчина, вы что не видите? У нас обед!')

  return new Promise((resolve) => {
    const int = setInterval(async () => {
      if (await check(fromMinute, toMinute)) {
        console.log('Ладно, давайте сюда.')
        clearInterval(int)
        resolve()
      }
    }, 1000)
  })
}

/**
 * Waits until a blocked minute range has passed.
 *
 * @param {{ fromMinute?: number, toMinute?: number }} [options]
 * @returns {Promise<void>}
 */
export const waitForFika = async ({ fromMinute = FIKA_FROM, toMinute = FIKA_TO } = {}) => {
  await fikaCheck(fromMinute, toMinute)
}

/**
 * Waits until a file appears on disk.
 *
 * @param {{ at: string }} options
 * @returns {Promise<void>}
 *
 * @example
 * await waitForFile({
 *   at: '/tmp/ready.flag',
 * })
 */
export const waitForFile = async ({ at }) => {
  await fikaCheck(at)
}
