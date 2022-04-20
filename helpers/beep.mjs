import { stdout } from 'process'

export const beep = () => stdout.write('\u0007')
