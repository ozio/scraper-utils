import crypto from 'node:crypto'

/**
 * Generates a hexadecimal hash using the selected algorithm.
 *
 * @param {string} algorithm
 * @param {string | Buffer} contents
 * @returns {string}
 */
export const generateHash = (algorithm, contents) => {
  return crypto.createHash(algorithm).update(contents).digest('hex')
}

/**
 * Generates a hexadecimal hash using named options.
 *
 * @param {string | Buffer} contents
 * @param {{ using: string }} options
 * @returns {string}
 *
 * @example
 * const digest = hashOf('hello', {
 *   using: 'sha256',
 * })
 */
export const hashOf = (contents, { using }) => {
  return generateHash(using, contents)
}

/**
 * Generates a SHA-256 hash.
 *
 * @param {string | Buffer} contents
 * @returns {string}
 */
export const generateHashSHA256 = (contents) => {
  return generateHash('sha256', contents)
}

/**
 * Generates an MD5 hash.
 *
 * @param {string | Buffer} contents
 * @returns {string}
 */
export const generateHashMD5 = (contents) => {
  return generateHash('md5', contents)
}
