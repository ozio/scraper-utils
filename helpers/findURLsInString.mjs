const regex = /(\b(https?|ftp|file|tg|viber|whatsapp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi

/**
 * Finds URLs in a string with a shorter, more natural name.
 *
 * @param {string} string
 * @returns {string[]}
 * @style target
 */
export const urlsIn = (string) => [...(string.match(regex) || [])]

/**
 * Finds URLs in a string.
 *
 * @param {string} string
 * @returns {string[]}
 *
 * @example
 * const links = urlsIn('Open https://example.com and tg://resolve?domain=test')
 * @style legacy
 */
export const findURLsInString = (string) => urlsIn(string)
