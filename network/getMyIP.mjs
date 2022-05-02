import { goto } from './goto.mjs'

export const getMyIP = async () => {
  const { body: ip } = await goto('https://api.ipify.org/')

  console.log('Мой текущий IP:', ip)

  return ip
}
