import util from 'util'
import { exec } from 'child_process'

export const exec = util.promisify(exec)
