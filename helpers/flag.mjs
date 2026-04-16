import { argv } from 'process'

/**
 * Reads a CLI flag from `process.argv`.
 *
 * Returns:
 * - `false` when the flag is missing
 * - `true` when the flag exists without a value
 * - the string value when the flag looks like `--name=value`
 *
 * @param {string} name
 * @returns {string | boolean}
 */
export const flag = (name) => {
  const arg = argv.find((a) => a.startsWith(name + '=') || a === name)

  if (arg) {
    const [, value] = arg.split('=')

    return value || true
  }

  return false
}

/**
 * Reads a CLI flag using named arguments.
 *
 * @param {{ named: string }} options
 * @returns {string | boolean}
 *
 * @example
 * const proxy = readFlag({
 *   named: '--proxy',
 * })
 */
export const readFlag = ({ named }) => {
  return flag(named)
}

/**
 * Checks whether a CLI flag is present.
 *
 * @param {string} name
 * @returns {boolean}
 */
export const hasFlag = (name) => {
  return flag(name) !== false
}
