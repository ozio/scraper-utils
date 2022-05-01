import AdmZip from 'adm-zip'
import fs from 'fs/promises'

const FILENAME = 'file.txt'

export const readArchivedFile = async (absPath) => {
  const zip = new AdmZip(absPath)

  return new Promise(resolve => zip.readAsTextAsync(FILENAME, resolve, 'utf-8'))
}

export const writeArchivedFile = async (absPath, contents) => {
  const zip = new AdmZip()

  zip.addFile(FILENAME, contents)

  return zip.writeZipPromise(absPath)
}

export const archiveFile = async (absPath, opts = {}) => {
  const { removeOriginal } = opts

  const zip = new AdmZip()

  zip.addLocalFile(absPath, '', FILENAME)
  await zip.writeZipPromise(`${absPath}.zip`)

  if (removeOriginal) {
    await fs.unlink(absPath)
  }
}

export const unarchiveFile = async (absPath, opts = {}) => {
  const { removeOriginal } = opts

  const zip = new AdmZip(absPath)
  const targetPath = absPath.split('/').slice(0, -1).join('/')
  const outFileName = absPath.split('/').slice(-1).join('')

  zip.extractEntryTo(FILENAME, targetPath, false, true, false, outFileName)

  if (removeOriginal) {
    await fs.unlink(absPath)
  }
}
