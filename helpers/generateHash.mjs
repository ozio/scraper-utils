import crypto from 'node:crypto'

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
 * @style target
 */
export const hashOf = (contents, { using }) => crypto.createHash(using).update(contents).digest('hex')

/**
 * Generates a hexadecimal hash using the selected algorithm.
 *
 * @param {string} algorithm
 * @param {string | Buffer} contents
 * @returns {string}
 * @style legacy
 */
export const generateHash = (algorithm, contents) => hashOf(contents, { using: algorithm })

/**
 * Generates a SHA-256 hash.
 *
 * @param {string | Buffer} contents
 * @returns {string}
 * @style legacy
 */
export const generateHashSHA256 = (contents) => hashOf(contents, { using: 'sha256' })

/**
 * Generates an MD5 hash.
 *
 * @param {string | Buffer} contents
 * @returns {string}
 * @style legacy
 */
export const generateHashMD5 = (contents) => hashOf(contents, { using: 'md5' })
