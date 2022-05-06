import { EventEmitter } from 'node:events'

export class Queue extends EventEmitter {
  static DEFAULT_STREAMS = 5
  static DEFAULT_ERRORS_LIMIT = 20

  processing = new Set()
  queue = new Set()
  errorsCount = 0

  constructor({
    streams = Queue.DEFAULT_STREAMS,
    errorsLimit = Queue.DEFAULT_ERRORS_LIMIT,
    process = () => {},
  }) {
    super()

    this.streams = streams
    this.process = process
    this.errorsLimit = errorsLimit
  }

  #runStream = async () => {
    if (this.queue.size === 0) return
    if (this.errorsCount >= this.errorsLimit) return

    let item

    for (const _item of this.queue) {
      if (this.processing.has(_item)) continue

      item = _item
      break
    }

    if (typeof item === 'undefined') return

    this.emit('process:start', { item })
    try {
      this.processing.add(item)
      const results = await this.process(item)
      this.queue.delete(item)
      this.emit('process:finish', { item, results, queueSize: this.queue.size })
    } catch (error) {
      this.errorsCount++
      this.emit('process:error', { item, error })
    } finally {
      this.processing.delete(item)
    }

    return this.#runStream()
  }

  add = (item) => {
    this.queue.add(item)
  }

  addMany = (list) => {
    for (const item of list) {
      this.add(item)
    }
  }

  run = async (list) => {
    if (list) {
      this.addMany(list)
    }

    this.emit('queue:start')

    await Promise.all(new Array(this.streams).fill(undefined).map(this.#runStream))

    if (this.errorsCount >= this.errorsLimit) {
      this.emit('queue:errors-limit', { items: [...this.queue] })
    }

    this.emit('queue:finish')
  }
}
