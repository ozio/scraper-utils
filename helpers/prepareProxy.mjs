import { flag } from './flag.mjs'

let proxy = flag('--proxy') || '127.0.0.1:9050'

if (flag('--no-proxy')) {
  proxy = undefined
}
