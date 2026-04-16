import { flag } from './flag.mjs'

const DEFAULT_PROXY = '127.0.0.1:9050'

/**
 * Resolves the proxy value from CLI flags.
 *
 * `--no-proxy` wins over `--proxy`.
 *
 * @param {{ fallback?: string }} [options]
 * @returns {string | undefined}
 */
export const resolveProxy = ({ fallback = DEFAULT_PROXY } = {}) => {
  if (flag('--no-proxy')) {
    return undefined
  }

  return flag('--proxy') || fallback
}

/**
 * The proxy resolved from the current process flags.
 *
 * @type {string | undefined}
 */
export const proxy = resolveProxy()

/**
 * Returns the proxy resolved from the current process flags.
 *
 * @returns {string | undefined}
 */
export const getProxy = () => proxy
