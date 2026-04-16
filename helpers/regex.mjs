/**
 * Matches all non-digit characters.
 *
 * @type {RegExp}
 */
export const REGEX_NON_NUMBERS = /[^0-9]/g

/**
 * Matches text inside round brackets.
 *
 * @type {RegExp}
 */
export const REGEX_INSIDE_ROUND_BRACKETS = /(?<=\().+?(?=\))/g
