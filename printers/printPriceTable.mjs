import chalk from 'chalk'

const BLOCK_WIDTH = 5

const formatPrice = (number) => {
  return (
    (number / 1000).toLocaleString('ru', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }) + 'к'
  )
}

/**
 * Prints a price difference table using named values.
 *
 * @param {{ from: Record<string, number>, to: Record<string, number> }} options
 * @returns {void}
 * @style target
 */
export const printPriceDiff = ({ from, to }) => {
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

    let previous = formatPrice(from[k])
    let next = formatPrice(to[k])

    previous = previous === '0к' ? '-' : previous
    next = next === '0к' ? '-' : next

    if (pos === 4) {
      rows[shift ? 2 : 0][pos] = chalk.dim('│')
      rows[shift ? 3 : 1][pos] = chalk.dim('│')
    }

    if (pos >= 4) {
      pos += 1
    }

    if (from[k] !== to[k]) {
      rows[shift ? 2 : 0][pos] = previous.padStart(BLOCK_WIDTH)
      rows[shift ? 3 : 1][pos] =
        from[k] < to[k] ? chalk.green(`${next}`.padStart(BLOCK_WIDTH)) : chalk.red(`${next}`.padStart(BLOCK_WIDTH))
    } else {
      rows[shift ? 2 : 0][pos] = chalk.dim(previous.padStart(BLOCK_WIDTH))
      rows[shift ? 3 : 1][pos] = ''.padStart(BLOCK_WIDTH)
    }

    if (idx === keys.length - 1) {
      pos += 1
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

/**
 * @style legacy
 */
export const printPriceTable = (prevValue, nextValue) => printPriceDiff({ from: prevValue, to: nextValue })
