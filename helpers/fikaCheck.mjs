import fs from 'fs/promises'

const FIKA_FROM = 0 // *:00
const FIKA_TO = 5   // *:05

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
