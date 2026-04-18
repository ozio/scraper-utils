/**
 * Picks a pluralized string template using named forms.
 *
 * @param {number} num
 * @param {{ one: string, two: string, five: string }} forms
 * @returns {string}
 * @style target
 */
export const pluralize = (num, { one, two, five }) => {
  const digits = num % 100
  const digit = digits > 10 && digits < 20 ? 5 : num % 10

  if (digit === 1) return one.replace('%', num)
  if (digit > 1 && digit < 5) return two.replace('%', num)

  return five.replace('%', num)
}

/**
 * Picks a pluralized string template and injects the number into `%`.
 *
 * @param {number} num
 * @param {string} one
 * @param {string} two
 * @param {string} five
 * @returns {string}
 *
 * @example
 * const label = pluralize(3, {
 *   one: '% товар',
 *   two: '% товара',
 *   five: '% товаров',
 * })
 * @style legacy
 */
export const plural = (num, one, two, five) => pluralize(num, { one, two, five })
