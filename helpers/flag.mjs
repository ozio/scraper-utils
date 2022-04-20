import { argv } from 'process'

export const flag = (name) => {
  const arg = argv.find(a => a.startsWith(name + '=') || a === name)

  if (arg) {
    const [, value] = arg.split('=')

    return value || true
  }

  return false
}
