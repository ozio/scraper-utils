import { promisify } from 'util'
import { exec } from 'child_process'

const execCommand = promisify(exec)

/**
 * Runs a shell command with an optional working directory.
 *
 * @param {string} command
 * @param {import('child_process').ExecOptions} [options]
 * @returns {Promise<{ stdout: string, stderr: string }>}
 *
 * @example
 * const { stdout } = await runCommand('pwd', {
 *   in: '/tmp',
 * })
 * @style target
 */
export const runCommand = async (command, { in: cwd, ...options } = {}) => {
  return execCommand(command, cwd ? { cwd, ...options } : options)
}

/**
 * Runs a shell command and returns only stdout.
 *
 * @param {string} command
 * @param {import('child_process').ExecOptions} [options]
 * @returns {Promise<string>}
 * @style target
 */
export const readCommandOutput = async (command, options = {}) => {
  const { stdout } = await runCommand(command, options)
  return stdout
}

/**
 * Promisified `child_process.exec`.
 *
 * @type {(command: string, options?: import('child_process').ExecOptions) => Promise<{ stdout: string, stderr: string }>}
 * @style legacy
 */
export const execAsync = execCommand
