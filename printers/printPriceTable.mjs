const chalk = require('chalk')

const BLOCK_WIDTH = 5

const formatPrice = (number) => {
  return (
    (number / 1000).toLocaleString('ru', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }) + 'к'
  )
}

const printPriceTable = (prevValue, nextValue) => {
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

  /*['🌞', '🌞🌞', '🌚', '🌚🌚🌚', 'Анал', 'МБР', 'ОВР']*/

  const rows = [[], [], [], []]

  keys.forEach((k, idx) => {
    let pos = idx % 7
    let shift = idx >= 7

    let p = formatPrice(prevValue[k])
    let n = formatPrice(nextValue[k])

    p = p === '0к' ? '-' : p
    n = n === '0к' ? '-' : n

    if (pos === 4) {
      rows[shift ? 2 : 0][pos] = chalk.dim('│')
      rows[shift ? 3 : 1][pos] = chalk.dim('│')
    }

    if (pos >= 4) {
      pos++
    }

    if (prevValue[k] !== nextValue[k]) {
      rows[shift ? 2 : 0][pos] = p.padStart(BLOCK_WIDTH)
      rows[shift ? 3 : 1][pos] =
        prevValue[k] < nextValue[k]
          ? chalk.green(`${n}`.padStart(BLOCK_WIDTH))
          : chalk.red(`${n}`.padStart(BLOCK_WIDTH))
    } else {
      rows[shift ? 2 : 0][pos] = chalk.dim(p.padStart(BLOCK_WIDTH))
      rows[shift ? 3 : 1][pos] = ''.padStart(BLOCK_WIDTH)
    }

    if (idx === keys.length - 1) {
      pos++
      rows[shift ? 2 : 0][pos] = chalk.dim('│')
      rows[shift ? 3 : 1][pos] = chalk.dim('│')
    }
  })

  const line = new Array(7 * (BLOCK_WIDTH + 1) + 1).fill('─').join('')

  console.log(chalk.dim(line))
  console.log(rows[0].join(' '))
  console.log(rows[1].join(' '))
  console.log(chalk.dim(line.replaceAll('─', '-')))
  console.log(rows[2].join(' '))
  console.log(rows[3].join(' '))
  console.log(chalk.dim(line))
}
