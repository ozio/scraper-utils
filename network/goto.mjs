import fetch from 'node-fetch'
import { Iconv } from 'iconv'
import { SocksProxyAgent } from 'socks-proxy-agent'
import AbortController from 'abort-controller'

const conv = Iconv('windows-1251', 'utf8')
const TIMEOUT = 15000

export const goto = async (url, proxy) => {
  const opts = {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
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

  if (url.includes('intimcity.nl')) {
    opts.headers.authority = 'www.intimcity.nl'
  }

  if (proxy) {
    let proxyURL

    if (proxy === 'tor') {
      proxyURL = 'socks5://127.0.0.1:9050'
    } else if (proxy === 'google') {
      proxyURL = 'socks5://127.0.0.1:5000'
    } else {
      proxyURL = 'socks5://' + proxy
    }

    if (proxyURL) {
      opts.agent = new SocksProxyAgent(proxyURL)
    }
  }

  const controller = new AbortController()
  opts.signal = controller.signal

  const timeout = setTimeout(() => controller.abort(), TIMEOUT)

  const res = await fetch(url, opts)

  clearTimeout(timeout)

  const status = res.status
  const buffer = Buffer.from(await res.arrayBuffer())

  let body

  if (url.includes('intimcity.nl')) {
    try {
      body = conv.convert(buffer).toString()
    } catch (e) {
      body = buffer.toString()
    }
  } else {
    body = buffer.toString()
  }

  return { body, status }
}

/**
 * Fetches a page and returns both body and status.
 *
 * @param {{ at: string, proxy?: string }} options
 * @returns {Promise<{ body: string, status: number }>}
 *
 * @example
 * const page = await fetchPage({
 *   at: 'https://example.com',
 * })
 */
export const fetchPage = async ({ at, proxy } = {}) => {
  return goto(at, proxy)
}

/**
 * Reads only the page body from a URL.
 *
 * @param {{ at: string, proxy?: string }} options
 * @returns {Promise<string>}
 *
 * @example
 * const html = await readPage({
 *   at: 'https://example.com',
 * })
 */
export const readPage = async ({ at, proxy } = {}) => {
  const { body } = await fetchPage({ at, proxy })
  return body
}
