import EventEmitter from 'events'
import { Iconv } from 'iconv'
import { SocksProxyAgent } from 'socks-proxy-agent'
import AbortController from 'abort-controller'
import fetch from 'node-fetch'

export class Navigator extends EventEmitter {
  static DEFAULT_TIMEOUT = 15000

  stats = {
    pages: 0,
    bytes: 0,
  }

  ip
  conv
  agent
  label
  timeout

  processCookies

  opts = {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.5',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'cache-control': 'max-age=0',
    },
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: null,
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  }

  constructor({
    proxy,
    encoding,
    headers,
    label,
    cookies,
    processCookies,
    timeout = Navigator.DEFAULT_TIMEOUT,
  }) {
    super()

    this.label = label
    this.timeout = timeout
    this.processCookies = processCookies

    if (encoding) {
      this.conv = Iconv(encoding, 'utf8')
    }

    if (headers) {
      this.opts = {
        ...this.opts,
        headers: {
          ...this.opts.headers,
          ...headers,
        },
      }
    }

    if (proxy) {
      this.opts.agent = new SocksProxyAgent(proxy)
    }

    if (cookies) {
      this.opts.headers.cookie = cookies
    }

    this.initStats()
  }

  initStats() {
    this.on('page-open:finish', ({ size }) => {
      this.stats.pages++
      this.stats.bytes += size
    })
  }

  async go(url, shouldRetry) {
    this.emit('page-open:start', { label: this.label, url })

    const opts = this.opts

    if (url.includes('intimcity.nl')) {
      opts.headers.authority = 'www.intimcity.nl'
    }

    opts.agent = this.agent

    const controller = new AbortController()
    opts.signal = controller.signal

    const timeout = setTimeout(controller.abort, this.timeout)

    let res

    try {
      res = await fetch(url, opts)

      console.log(res.headers.get('set-cookie'))

      if (this.processCookies && res.headers.get('set-cookie')) {
        this.opts.headers.cookie = this.processCookies(
          this.opts.headers.cookie,
          res.headers.get('set-cookie'),
        )
      }

      if (!res.ok) {
        throw new Error(`${res.statusText} (${res.status})`)
      }
    } catch (error) {
      const errorPayload = { label: this.label, url, error }

      if (shouldRetry) {
        this.emit('page-open:retry', errorPayload)

        return this.go(url, shouldRetry)
      }

      this.emit('page-open:error', errorPayload)

      throw error
    }

    clearTimeout(timeout)

    const status = res.status
    const buffer = Buffer.from(await res.arrayBuffer())

    let html

    if (this.conv) {
      try {
        html = this.conv.convert(buffer).toString()
      } catch (e) {
        html = buffer.toString()
      }
    } else {
      html = buffer.toString()
    }

    let body = html
    let size = html.length

    const data = {
      label: this.label,
      url,
      status,
      size,
      body,
    }

    this.emit('page-open:finish', data)

    return data
  }

  async getIP() {
    if (this.ip) return this.ip

    const { body } = await this.go('https://api.ipify.org/')

    this.ip = body

    return this.ip
  }
}
