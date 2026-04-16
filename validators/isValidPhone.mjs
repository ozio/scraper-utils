/**
 * Checks whether a value looks like a valid Russian phone number.
 *
 * Accepts either:
 * - 10 digits without a country prefix
 * - 11 digits starting with `7` or `8`
 *
 * Obvious repeated fake numbers are rejected as well.
 *
 * @param {number | string | null | undefined} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone) return false

  const str = phone.toString(10)

  const isLol = [
    '1111111',
    '2222222',
    '3333333',
    '4444444',
    '5555555',
    '6666666',
    '7777777',
    '8888888',
    '9999999',
    '0000000',
  ].some((num) => {
    return str.includes(num)
  })

  if (isLol) return false

  if (str.length === 10) {
    return true
  }

  if (str.length === 11 && (str[0] === '7' || str[0] === '8')) {
    return true
  }

  return false
}
