import { EventEmitter } from 'node:events'

export class Queue extends EventEmitter {
  static DEFAULT_STREAMS = 5
  static DEFAULT_ERRORS_LIMIT = 20
  static DEFAULT_PROCESS = () => {}
  static DEFAULT_MAX_RETRIES = 0

  processing = new Set()
  queue = new Set()
  errorsCount = 0
  retries = new Map()
  #idleTimer = null

  constructor({
    streams = Queue.DEFAULT_STREAMS,
    errorsLimit = Queue.DEFAULT_ERRORS_LIMIT,
    process = Queue.DEFAULT_PROCESS,
    maxRetries = Queue.DEFAULT_MAX_RETRIES,
    timeoutMs = null,
    idleTimeoutMs = null,
    debugMode = false,
  }) {
    super()

    this.streams = streams
    this.process = process
    this.errorsLimit = errorsLimit
    this.timeoutMs = timeoutMs
    this.maxRetries = maxRetries
    this.idleTimeoutMs = idleTimeoutMs

    if (debugMode) {
      this.on('process:start', (args) => console.log('process:start', JSON.stringify(args)))
      this.on('process:finish', (args) => console.log('process:finish', JSON.stringify(args)))
      this.on('process:error', (args) => console.log('process:error', JSON.stringify(args)))
      this.on('process:retry', (args) => console.log('process:retry', JSON.stringify(args)))
      this.on('queue:start', (args) => console.log('queue:start', JSON.stringify(args)))
      this.on('queue:errors-limit', (args) => console.log('queue:errors-limit', JSON.stringify(args)))
      this.on('queue:finish', (args) => console.log('queue:finish', JSON.stringify(args)))
      this.on('queue:idle', () => console.log('queue:idle'))
    }
  }

  #resetIdleTimer = () => {
    if (!this.idleTimeoutMs) return

    clearTimeout(this.#idleTimer)
    this.#idleTimer = setTimeout(() => {
      if (this.queue.size === 0 && this.processing.size === 0) {
        this.emit('queue:idle')
      }
    }, this.idleTimeoutMs)
  }

  #withTimeout = (promise, timeoutMs) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout exceeded')), timeoutMs)
      ),
    ])
  }

  #runStream = async () => {
    if (this.queue.size === 0) return
    if (this.errorsLimit !== -1 && this.errorsCount >= this.errorsLimit) return

    let item

    for (const _item of this.queue) {
      if (this.processing.has(_item)) continue
      item = _item
      break
    }

    if (typeof item === 'undefined') return

    this.processing.add(item)
    this.emit('process:start', { item })
    this.#resetIdleTimer()

    try {
      const result = this.timeoutMs != null
        ? await this.#withTimeout(this.process(item), this.timeoutMs)
        : await this.process(item)

      this.emit('process:finish', { item, result })
      this.queue.delete(item)
    } catch (error) {
      const retryCount = this.retries.get(item) || 0

      if (retryCount < this.maxRetries) {
        this.retries.set(item, retryCount + 1)
        this.emit('process:retry', { item, retryCount: retryCount + 1 })
      } else {
        this.errorsCount++
        this.emit('process:error', {
          item,
          error,
          errorsCount: this.errorsCount,
          errorsLimit: this.errorsLimit,
        })
        this.queue.delete(item)
      }
    } finally {
      this.processing.delete(item)
      this.#resetIdleTimer()
    }

    return this.#runStream()
  }

  add = (item) => {
    this.queue.add(item)
    this.emit('queue:item-added', { item })
    this.#resetIdleTimer()

    if (this.queue.size === 1) {
      this.run()
    }
  }

  addMany = (list) => {
    for (const item of list) {
      this.add(item)
    }
    this.emit('queue:items-added', { items: list, count: list.length })
    this.#resetIdleTimer()
  }

  run = async (list) => {
    if (list) {
      this.addMany(list)
    }

    this.emit('queue:start')
    this.#resetIdleTimer()

    await Promise.all(Array.from({ length: this.streams }, this.#runStream))

    if (this.errorsLimit !== -1 && this.errorsCount >= this.errorsLimit) {
      this.emit('queue:errors-limit', {
        items: [...this.queue],
        errorsCount: this.errorsCount,
        errorsLimit: this.errorsLimit,
      })
    }

    this.emit('queue:finish', { errorsCount: this.errorsCount, errorsLimit: this.errorsLimit })
    this.#resetIdleTimer()
  }
}
