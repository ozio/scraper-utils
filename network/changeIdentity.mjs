import child_process from 'child_process'
import fetch from 'node-fetch'
import chalk from 'chalk'
import { SocksProxyAgent } from 'socks-proxy-agent'
import emojis from '../jsons/countryEmoji.json' assert { type: 'json' }

export const changeIdentity = async (port = '9050') => {
  const agent = new SocksProxyAgent(`socks5://127.0.0.1:${port}`)

  let lineLength = 0

  child_process.execSync(
    `lsof -i :${port} -P -n | grep LISTEN | awk '{print $2}' | xargs -n1 kill -HUP`,
  )

  let ip = ''

  try {
    const ipResponse = await fetch('https://api.ipify.org', { agent })
    ip = await ipResponse.text()
  } catch (e) {}

  let geoString = ''

  try {
    if (ip) {
      const geoResponse = await fetch(`http://ipwhois.app/json/${ip}`)
      const geoData = await geoResponse.json()
      const emoji = emojis[geoData.country_code]?.emoji || '🏳️‍🌈'

      geoString = geoData ? `// ${emoji}  ${geoData.country}, ${geoData.city}` : ''
    }
  } catch (e) {}

  const label = ip ? 'Новый IP:' : 'Новый IP получен.'

  lineLength += label.length
  lineLength += 1
  lineLength += ip.length
  lineLength += 1
  lineLength += geoString.length

  const message = `${chalk.bold(label)} ${chalk.yellow(ip)} ${chalk.dim(geoString)}`
  const border = new Array(lineLength).fill().join('—')

  console.log(border)
  console.log()
  console.log(message)
  console.log()
  console.log(border)
}
