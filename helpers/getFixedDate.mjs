/**
 * Rounds a date to the nearest hour.
 *
 * Dates after half past are rounded up to the next full hour.
 *
 * @param {Date} [date=new Date()]
 * @returns {Date}
 *
 * @example
 * const fixedAt = roundDateToHour(new Date())
 * @style target
 */
export const getFixedDate = (date = new Date()) => {
  const fixedAt = new Date(date)

  if (fixedAt.getMinutes() > 30) {
    fixedAt.setHours(fixedAt.getHours() + 1)
  }

  fixedAt.setMinutes(0)
  fixedAt.setSeconds(0)
  fixedAt.setMilliseconds(0)

  return fixedAt
}

/**
 * Rounds a date to the nearest hour with a more descriptive name.
 *
 * @param {Date} [date=new Date()]
 * @returns {Date}
 * @style target
 */
export const roundDateToHour = (date = new Date()) => {
  return getFixedDate(date)
}
