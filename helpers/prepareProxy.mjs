import { hasFlag, readFlag } from './flag.mjs'

const DEFAULT_PROXY = '127.0.0.1:9050'

/**
 * Resolves the proxy value from CLI flags.
 *
 * `--no-proxy` wins over `--proxy`.
 *
 * @param {{ fallback?: string }} [options]
 * @returns {string | undefined}
 * @style target
 */
export const resolveProxy = ({ fallback = DEFAULT_PROXY } = {}) => {
  if (hasFlag('--no-proxy')) {
    return undefined
  }

  return readFlag({ named: '--proxy' }) || fallback
}

/**
 * The proxy resolved from the current process flags.
 *
 * @type {string | undefined}
 * @style legacy
 */
export const proxy = resolveProxy()

/**
 * Returns the proxy resolved from the current process flags.
 *
 * @returns {string | undefined}
 * @style legacy
 */
export const getProxy = () => proxy
