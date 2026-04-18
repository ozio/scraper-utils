import { calculateMedian } from '../helpers/calculateMedian.mjs'
import { calculateAverage } from '../helpers/calculateAverage.mjs'

/**
 * @style target
 */
export class TimeLeft {
  static LIMIT = 100

  records = []

  /**
   * Records one processed item duration.
   *
   * @param {number} timeRange
   * @style target
   */
  record(timeRange) {
    if (this.records.length >= TimeLeft.LIMIT) {
      this.records.shift()
    }

    this.records.push(timeRange)
  }

  /**
   * Estimates the remaining time using the average duration.
   *
   * @param {{ itemsLeft: number }} options
   * @returns {number}
   * @style target
   */
  averageFor({ itemsLeft }) {
    const average = calculateAverage(this.records)

    return itemsLeft * average
  }

  /**
   * Estimates the remaining time using the median duration.
   *
   * @param {{ itemsLeft: number }} options
   * @returns {number}
   * @style target
   */
  medianFor({ itemsLeft }) {
    const median = calculateMedian(this.records)

    return itemsLeft * median
  }

  /**
   * Records one processed item duration.
   *
   * @param {number} timerange
   * @style legacy
   */
  add(timerange) {
    this.record(timerange)
  }

  /**
   * Estimates the remaining time using the average duration.
   *
   * @param {number} itemsLeft
   * @returns {number}
   * @style legacy
   */
  getAverage(itemsLeft) {
    return this.averageFor({ itemsLeft })
  }

  /**
   * Estimates the remaining time using the median duration.
   *
   * @param {number} itemsLeft
   * @returns {number}
   * @style legacy
   */
  getMedian(itemsLeft) {
    return this.medianFor({ itemsLeft })
  }
}
