/**
 * Formats a 10-digit Russian phone number body into `+7 (...) ...-..-..`.
 *
 * @param {number | string} int
 * @returns {string}
 */
export const formatPhone = (int) => {
  const s = int.toString()

  return `+7 (${s.slice(0, 3)}) ${s.slice(3, 6)}-${s.slice(6, 8)}-${s.slice(8, 10)}`
}
