import { icIdRangesByYear } from '../constants/ic.mjs'

const guessYear = ({ platform, id }) => {
  if (platform === 'rd') return 2022

  if (platform === 'ic') {
    let currentYear
    let lastEdge

    icIdRangesByYear.forEach(([from, to], year) => {
      if (id >= from) {
        currentYear = year
      } else if (id >= lastEdge) {
        const diff = lastEdge - from
        if (id - from > diff / 2) {
          currentYear = year
        }
      }

      lastEdge = to
    })

    return currentYear
  }
}

/**
 * Guesses the year for an item id on a supported platform.
 *
 * Supported platforms:
 * - `ic`
 * - `rd`
 *
 * @param {'ic' | 'rd'} platform
 * @param {number} id
 * @returns {number | undefined}
 * @style legacy
 */
export const getYearById = (platform, id) => guessYear({ platform, id })

/**
 * Guesses the year for an item id using named options.
 *
 * @param {{ platform: 'ic' | 'rd', id: number }} options
 * @returns {number | undefined}
 *
 * @example
 * const year = yearForId({
 *   platform: 'ic',
 *   id: 125001,
 * })
 * @style target
 */
export const yearForId = ({ platform, id }) => {
  return guessYear({ platform, id })
}

/**
 * Guesses the year for an Intimcity id.
 *
 * @param {number} id
 * @returns {number | undefined}
 * @style target
 */
export const getYearByICId = (id) => yearForId({ platform: 'ic', id })

/**
 * Guesses the year for an RD id.
 *
 * @param {number} id
 * @returns {number | undefined}
 * @style target
 */
export const getYearByRDId = (id) => yearForId({ platform: 'rd', id })
