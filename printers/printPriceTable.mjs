import chalk from 'chalk'
import Table from 'cli-table'

export const printPriceTable = (prevValue, nextValue) => {
  const keys = [
    'priceDay1HIn',
    'priceDay2HIn',
    'priceNight1HIn',
    'priceNightIn',
    'priceAnal',
    'priceMBR',
    'priceOVR',
    'priceDay1HOut',
    'priceDay2HOut',
    'priceNight1HOut',
    'priceNightOut',
  ]

  const table = new Table({
    head: ['', '🌞', '🌞🌞', '🌚', '🌚🌚🌚', 'Анал', 'МБР', 'ОВР'].map(n => chalk.white.bold(n)),
    chars: {
      'top': '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      'bottom': '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      'left': '',
      'left-mid': '',
      'mid': '',
      'mid-mid': '',
      'right': '',
      'right-mid': '',
      'middle': ' ',
    },
    style: {
      'padding-left': 0,
      'padding-right': 0,
    },
    colAligns: ['right', 'right', 'right', 'right', 'right', 'right', 'right', 'right'],
    colWidths: [5, 9, 9, 9, 9, 9, 9, 9],
  })

  const rows = [
    [chalk.white.bold('Дом')],
    [''],
    [chalk.white.bold('Выезд')],
    [''],
  ]

  keys.forEach((k, idx) => {
    let pos = idx % 7 + 1
    let shift = idx >= 7

    let p = prevValue[k].toLocaleString('ru', { minimumFractionDigits: 0 })
    let n = nextValue[k].toLocaleString('ru', { minimumFractionDigits: 0 })

    p = p === '0' ? '-' : p
    n = n === '0' ? '-' : n

    if (prevValue[k] !== nextValue[k]) {
      rows[shift ? 2 : 0][pos] = p
      rows[shift ? 3 : 1][pos] = prevValue[k] < nextValue[k] ? chalk.green('↑ ' + n) : chalk.red('↓ ' + n)
    } else {
      rows[shift ? 2 : 0][pos] = chalk.dim(p)
      rows[shift ? 3 : 1][pos] = ''
    }
  })

  rows[2].push(...['', '', ''])
  rows[3].push(...['', '', ''])

  table.push(...rows)

  const tableStr = table.toString()

  const [firstLine, ...otherLines] = tableStr.split('\n')

  const lineLength = firstLine
    .replaceAll('\x1B[31m', '')
    .replaceAll('\x1B[39m', '')
    .replaceAll('\x1B[90m', '')
    .replaceAll('\x1B[22m', '')
    .replaceAll('\x1B[37m', '')
    .replaceAll('\x1B[1m', '')
  .length

  const line = new Array(lineLength).fill('─').join('')

  console.log(chalk.dim(line))
  console.log(firstLine)
  console.log(chalk.dim(line.replaceAll('─', '-')))
  console.log(otherLines.join('\n'))
  console.log(chalk.dim(line))
}
