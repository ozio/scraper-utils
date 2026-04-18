import { argv } from 'process'

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
 * @style target
 */
export const readFlag = ({ named }) => {
  const arg = argv.find((a) => a.startsWith(named + '=') || a === named)

  if (arg) {
    const [, value] = arg.split('=')

    return value || true
  }

  return false
}

/**
 * Checks whether a CLI flag is present.
 *
 * @param {string} name
 * @returns {boolean}
 * @style target
 */
export const hasFlag = (name) => readFlag({ named: name }) !== false

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
 * @style legacy
 */
export const flag = (name) => readFlag({ named: name })
