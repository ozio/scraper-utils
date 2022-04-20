const SECOND = 1000

export const sleep = (ms = 100) => new Promise((resolve => {
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
}))
