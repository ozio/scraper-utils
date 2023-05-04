import { icIdRangesByYear } from '../constants/ic.mjs'

const icYears = new Set(icIdRangesByYear.keys())

export const getYearById = (platform, id) => {
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

export const getYearByICId = (id) => getYearById('ic', id)

export const getYearByRDId = (id) => getYearById('rd', id)
