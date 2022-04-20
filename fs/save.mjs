import fs from 'fs/promises'

export const save = async (filename, body) => {
  let html = body.replace('charset=windows-1251', 'charset=utf-8')

  await fs.writeFile(filename, html, 'utf-8')
}
