import chalk from 'chalk'
import ColorHashPackage from 'color-hash'

const ColorHash = ColorHashPackage?.default ?? ColorHashPackage
const ch = new ColorHash()

export const colorHash = (text) => {
  const color = ch.hex(text)

  return chalk.hex(color)(text)
}
