import chalk from 'chalk'
import pkg from 'color-hash'

const ColorHash = pkg.default;
const ch = new ColorHash();

export const colorHash = (text) => {
  const color = ch.hex(text)

  return chalk.hex(color)(text)
}
