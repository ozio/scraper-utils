import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const packageJsonPath = path.join(ROOT, 'package.json')
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
const tag = `v${packageJson.version}`

const run = (command, args) => {
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
  })
}

const output = (command, args) => {
  return execFileSync(command, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
  }).trim()
}

const worktree = output('git', ['status', '--short'])

if (worktree) {
  console.error('Working tree is not clean. Commit or stash changes before publishing.')
  process.exit(1)
}

const existingTag = output('git', ['tag', '--list', tag])

if (existingTag) {
  console.error(`Tag ${tag} already exists. Bump the version before publishing again.`)
  process.exit(1)
}

console.log(`Publishing ${packageJson.name}@${packageJson.version}`)

run('npm', ['publish', '--access', 'public'])
run('git', ['tag', tag])
run('git', ['push', 'origin', tag])
