const HOUR = 1000 * 60 * 60
const MINUTE = 1000 * 60
const SECOND = 1000

/**
 * Formats a duration in milliseconds into a compact human-readable string.
 *
 * @param {number} range
 * @param {boolean} [withMS=false]
 * @returns {string}
 */
export const formatTimeRange = (range, withMS) => {
  //if (range < 1000) return '0с';

  const hoursInMs = range - (range % HOUR)
  const minutesInMs = range - hoursInMs - (range % MINUTE)
  const secondsInMs = range - hoursInMs - minutesInMs - (range % SECOND)

  const hours = hoursInMs / HOUR
  const minutes = minutesInMs / MINUTE
  const seconds = secondsInMs / SECOND
  const ms = range % 1000

  const output = []

  if (hours > 0) {
    output.push(`${hours}ч`)
  }

  if (minutes > 0) {
    output.push(`${minutes}м`)
  }

  if (seconds > 0) {
    output.push(`${seconds}с`)
  }

  if (withMS || output.length === 0) {
    output.push(`${ms}мс`)
  }

  return output.join(' ')
}
