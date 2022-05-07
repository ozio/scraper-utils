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
    debugMode = false
  }) {
    super()

    this.streams = streams
    this.process = process
    this.errorsLimit = errorsLimit

    if (debugMode) {
      this.on('process:start', args => console.log('process:start', JSON.stringify(args)))
      this.on('process:finish', args => console.log('process:finish', JSON.stringify(args)))
      this.on('process:error', args => console.log('process:error', JSON.stringify(args)))
      this.on('queue:start', args => console.log('queue:start', JSON.stringify(args)))
      this.on('queue:errors-limit', args => console.log('queue:errors-limit', JSON.stringify(args)))
      this.on('queue:finish', args => console.log('queue:finish', JSON.stringify(args)))
    }
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
      this.emit('process:finish', { item, results, queueSize: this.queue.size })
      this.queue.delete(item)
    } catch (error) {
      this.errorsCount++
      this.emit('process:error', { item, error, errorsCount: this.errorsCount, errorsLimit: this.errorsLimit })
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

    await Promise.all(new Array(this.streams).fill(undefined)
      .map(this.#runStream))

    if (this.errorsCount >= this.errorsLimit) {
      this.emit('queue:errors-limit', {
        items: [...this.queue],
        errorsCount: this.errorsCount,
        errorsLimit: this.errorsLimit
      })
    }

    this.emit('queue:finish', { errorsCount: this.errorsCount, errorsLimit: this.errorsLimit })
  }
}
