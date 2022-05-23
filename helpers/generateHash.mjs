import crypto from 'node:crypto'

export const generateHash = (algorithm, contents) => {
  return crypto.createHash(algorithm)
    .update(contents)
    .digest('hex')
}

export const generateHashSHA256 = (contents) => {
  return generateHash('sha256', contents)
}

export const generateHashMD5 = (contents) => {
  return generateHash('md5', contents)
}
