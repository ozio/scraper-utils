/**
 * Reads a stream into a UTF-8 string.
 *
 * @param {AsyncIterable<any>} stream
 * @returns {Promise<string>}
 */
export const streamToString = async (stream) => {
  const chunks = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString('utf-8')
}

/**
 * Reads a stream into a string with named options.
 *
 * @param {{ from: AsyncIterable<any>, encoding?: BufferEncoding }} options
 * @returns {Promise<string>}
 *
 * @example
 * const text = await readStreamAsString({
 *   from: stream,
 * })
 */
export const readStreamAsString = async ({ from, encoding = 'utf-8' }) => {
  const chunks = []

  for await (const chunk of from) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString(encoding)
}
