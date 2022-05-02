import { calculateMedian } from '../helpers/calculateMedian.mjs'
import { calculateAverage } from '../helpers/calculateAverage.mjs'

export class TimeLeft {
  static LIMIT = 100

  records = []

  add(timerange) {
    if (this.records.length >= TimeLeft.LIMIT) {
      this.records.shift()
    }

    this.records.push(timerange)
  }

  getAverage(itemsLeft) {
    const average = calculateAverage(this.records)

    return itemsLeft * average
  }

  getMedian(itemsLeft) {
    const median = calculateMedian(this.records)

    return itemsLeft * median
  }
}
