import { readPage } from './goto.mjs'

export const getMyIP = async () => {
  const ip = await readPage({ at: 'https://api.ipify.org/' })

  console.log('Мой текущий IP:', ip)

  return ip
}
