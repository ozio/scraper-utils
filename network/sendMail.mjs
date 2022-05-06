import nodemailer from 'nodemailer'
import ansiHTML from 'ansi-html'
import linkifyHtml from 'linkify-html'

import 'dotenv/config'

ansiHTML.setColors({
  reset: ['inherit', 'inherit'], // [FOREGROUD_COLOR, BACKGROUND_COLOR]
  black: '646464',
  red: 'ee534e',
  green: '5ca955',
  yellow: 'e8a703',
  blue: '3e7ec4',
  magenta: 'be5ec7',
  cyan: '49b0b4',
  lightgrey: 'inherit',
  darkgrey: '646464',
})

export const sendMail = async ({
  to,
  from,
  subject = 'no subject',
  contents,
  preview,
  credentials: { host, port, user, pass },
}) => {
  if (!contents) return

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: true,
    auth: {
      user,
      pass,
    },
  })

  const ansiContents = ansiHTML(contents)

  let linkifiedContents = ansiContents

  try {
    linkifiedContents = linkifyHtml(ansiContents, {
      format: (value, type) => {
        if (type === 'url') {
          if (
            value.includes('localhost') ||
            value.includes('127.0.0.1') ||
            value.includes('0.0.0.0')
          ) {
            return value
          }

          const url = new URL(value)

          let text = url.pathname + url.search

          if (text.length > 22) {
            return text.slice(0, 11) + '...' + text.slice(-11)
          }

          return text
        }

        return value
      },
    })
  } catch (e) {
    linkifiedContents += e.stack
  }

  const html = `
    <body>
      <style>
        body {
          line-height: 1.3;
        }
      
        a {
          color: #424242;
          text-decoration: none;
        }
      </style>

      ${
        preview
          ? `
            <div style="mso-hide: all; position: fixed; height: 0; max-height: 0; overflow: hidden; font-size: 0;">
              ${preview}
            </div>`
          : ''
      }

      <div style="font-family: 'JetBrains Mono', Menlo, monospace; font-size: 85%; white-space: break-spaces;">${linkifyHtml(
        ansiHTML(contents),
        {
          format: (value, type) => {
            if (type === 'url') {
              if (
                value.includes('localhost') ||
                value.includes('127.0.0.1') ||
                value.includes('0.0.0.0')
              ) {
                return value
              }

              const url = new URL(value)

              let text = url.pathname + url.search

              if (text.length > 22) {
                return text.slice(0, 11) + '...' + text.slice(-11)
              }

              return text
            }

            return value
          },
        },
      )}</div>
    </body>
  `

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html: html,
  })

  console.log('Message sent:', info)
}
