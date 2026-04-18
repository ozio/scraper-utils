import chalk from 'chalk'
import ColorHashPackage from 'color-hash'

const ColorHash = ColorHashPackage?.default ?? ColorHashPackage
const ch = new ColorHash()

/**
 * Colors a string using a deterministic hash-derived color.
 *
 * @param {string} text
 * @returns {string}
 * @style target
 */
export const colorizeByHash = (text) => {
  const color = ch.hex(text)

  return chalk.hex(color)(text)
}

/**
 * @style legacy
 */
export const colorHash = (text) => colorizeByHash(text)
