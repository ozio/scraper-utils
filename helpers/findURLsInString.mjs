const regex = /(\b(https?|ftp|file|tg|viber|whatsapp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi

/**
 * Finds URLs in a string.
 *
 * @param {string} string
 * @returns {string[]}
 *
 * @example
 * const links = urlsIn('Open https://example.com and tg://resolve?domain=test')
 */
export const findURLsInString = (string) => {
  return [...(string.match(regex) || [])]
}

/**
 * Finds URLs in a string with a shorter, more natural name.
 *
 * @param {string} string
 * @returns {string[]}
 */
export const urlsIn = (string) => {
  return findURLsInString(string)
}
