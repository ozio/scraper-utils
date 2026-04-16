import { stdout } from 'process'

/**
 * Emits a terminal bell character.
 *
 * @returns {boolean}
 */
export const beep = () => stdout.write('\u0007')

/**
 * Emits a terminal bell character with a more descriptive name.
 *
 * @returns {boolean}
 */
export const ringBell = () => beep()
