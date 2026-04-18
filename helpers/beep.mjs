import { stdout } from 'process'

/**
 * Emits a terminal bell character with a more descriptive name.
 *
 * @returns {boolean}
 * @style target
 */
export const ringBell = () => stdout.write('\u0007')

/**
 * Emits a terminal bell character.
 *
 * @returns {boolean}
 * @style legacy
 */
export const beep = () => ringBell()
