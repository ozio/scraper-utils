const HOUR = 1000 * 60 * 60
const MINUTE = 1000 * 60
const SECOND = 1000

/**
 * Formats a duration in milliseconds using named options.
 *
 * @param {number} range
 * @param {{ includeMilliseconds?: boolean }} [options]
 * @returns {string}
 * @style target
 */
export const formatDuration = (range, { includeMilliseconds = false } = {}) => {
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

  if (includeMilliseconds || output.length === 0) {
    output.push(`${ms}мс`)
  }

  return output.join(' ')
}

/**
 * Formats a duration in milliseconds into a compact human-readable string.
 *
 * @param {number} range
 * @param {boolean} [withMS=false]
 * @returns {string}
 * @style legacy
 */
export const formatTimeRange = (range, withMS) => formatDuration(range, { includeMilliseconds: Boolean(withMS) })
