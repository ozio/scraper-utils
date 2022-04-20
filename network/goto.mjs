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
  const buffer = await res.buffer()

  let html

  try {
    html = conv.convert(buffer).toString()
  } catch (e) {
    html = buffer.toString()
  }

  return { body: html, status }
}
