import { calculateMedian } from '../helpers/calculateMedian.mjs'
import { calculateAverage } from '../helpers/calculateAverage.mjs'

export class AverageTimeCalc {
  static LIMIT = 100

  lastCoupleTimes = []

  addTimeRange(timerange) {
    if (this.lastCoupleTimes.length >= AverageTimeCalc.LIMIT) {
      this.lastCoupleTimes.shift()
    }

    this.lastCoupleTimes.push(timerange)
  }

  getAverageTimeToFinish(itemsLeft) {
    const average = calculateAverage(this.lastCoupleTimes)

    return itemsLeft * average
  }

  getMedianTimeToFinish(itemsLeft) {
    const median = calculateMedian(this.lastCoupleTimes)

    return itemsLeft * median
  }
}
